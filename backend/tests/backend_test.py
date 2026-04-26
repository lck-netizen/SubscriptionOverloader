"""End-to-end backend tests for Subscription Overload Manager (Node.js/Express)."""
import os
import time
import uuid
import subprocess
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to frontend .env for local execution
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test1234"


# -------- Fixtures --------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_token(session):
    r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"Login failed for seeded user: {r.status_code} {r.text}")
    data = r.json()
    assert "token" in data and isinstance(data["token"], str)
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def created_subs():
    return []


# -------- Health --------
def test_health(session):
    r = session.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    assert r.json().get("ok") is True


# -------- Auth: register / login / me / forgot / reset / verify-email --------
class TestAuth:
    new_email = f"qa+{uuid.uuid4().hex[:8]}@example.com"
    new_password = "qatest123"
    new_name = "QA Tester"
    captured = {}

    def test_register(self, session):
        r = session.post(f"{API}/auth/register", json={
            "name": self.new_name, "email": self.new_email, "password": self.new_password
        }, timeout=30)
        assert r.status_code == 201, r.text
        body = r.json()
        assert "token" in body and "user" in body
        assert body["user"]["email"] == self.new_email
        assert body["user"].get("isVerified") in (False, None, 0, "false")
        TestAuth.captured["token"] = body["token"]
        TestAuth.captured["user_id"] = body["user"].get("id") or body["user"].get("_id")

    def test_login_seeded(self, session):
        r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data.get("token"), str) and len(data["token"]) > 20
        assert data["user"]["email"] == TEST_EMAIL

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == TEST_EMAIL

    def test_me_unauthorized(self):
        # Use a fresh client without cookies/headers
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_forgot_password_idempotent(self, session):
        r = session.post(f"{API}/auth/forgot-password", json={"email": self.new_email}, timeout=30)
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # Even unknown email returns ok (avoid enumeration)
        r2 = session.post(f"{API}/auth/forgot-password", json={"email": "nobody-xyz@example.com"}, timeout=30)
        assert r2.status_code == 200

    def test_reset_password_invalid_token(self, session):
        r = session.post(f"{API}/auth/reset-password", json={"token": "deadbeef", "password": "newpass123"}, timeout=15)
        assert r.status_code == 400

    def test_verify_email_via_db_token(self, session):
        # Pull verification token from MongoDB directly
        try:
            out = subprocess.check_output([
                "mongosh", "test_database", "--quiet", "--eval",
                f"JSON.stringify(db.users.findOne({{email:'{TestAuth.new_email}'}}, {{verificationToken:1, _id:0}}))"
            ], stderr=subprocess.STDOUT, timeout=15).decode().strip()
        except Exception as e:
            pytest.skip(f"mongosh unavailable: {e}")
        try:
            doc = json.loads(out)
        except Exception:
            pytest.skip(f"could not parse mongosh output: {out!r}")
        token = doc.get("verificationToken")
        if not token:
            pytest.skip("no verificationToken stored (email may already be verified)")
        r = session.get(f"{API}/auth/verify-email", params={"token": token}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_verify_email_invalid_token(self, session):
        r = session.get(f"{API}/auth/verify-email", params={"token": "not-a-real-token"}, timeout=15)
        assert r.status_code == 400


# -------- Subscriptions CRUD + filters + meta + simulate --------
class TestSubscriptions:
    def test_meta(self, session, auth_headers):
        r = session.get(f"{API}/subscriptions/meta", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        for k in ("categories", "billingCycles", "statuses"):
            assert k in body and isinstance(body[k], list) and len(body[k]) > 0

    def test_create_list_update_delete(self, session, auth_headers, created_subs):
        payload = {
            "serviceName": "TEST_Netflix",
            "cost": 15.99,
            "billingCycle": "monthly",
            "renewalDate": "2026-02-15",
            "category": "OTT",
            "status": "active",
        }
        r = session.post(f"{API}/subscriptions", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code == 201, r.text
        sub = r.json()["subscription"]
        sid = sub["_id"] if "_id" in sub else sub["id"]
        assert sub["serviceName"] == "TEST_Netflix"
        assert sub["cost"] == 15.99
        assert sub["billingCycle"] == "monthly"
        created_subs.append(sid)

        # GET to verify persistence
        r = session.get(f"{API}/subscriptions", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        all_ids = [s.get("_id") or s.get("id") for s in r.json()["subscriptions"]]
        assert sid in all_ids

        # Filter by search
        r = session.get(f"{API}/subscriptions", headers=auth_headers, params={"search": "TEST_Netflix"}, timeout=15)
        assert r.status_code == 200
        names = [s["serviceName"] for s in r.json()["subscriptions"]]
        assert any("TEST_Netflix" in n for n in names)

        # Filter by category
        r = session.get(f"{API}/subscriptions", headers=auth_headers, params={"category": "OTT"}, timeout=15)
        assert r.status_code == 200
        for s in r.json()["subscriptions"]:
            assert s["category"] == "OTT"

        # Filter by cost range
        r = session.get(f"{API}/subscriptions", headers=auth_headers, params={"minCost": 10, "maxCost": 20}, timeout=15)
        assert r.status_code == 200
        for s in r.json()["subscriptions"]:
            assert 10 <= s["cost"] <= 20

        # Update
        r = session.put(f"{API}/subscriptions/{sid}", json={"cost": 19.99}, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["subscription"]["cost"] == 19.99

        # Simulate payment
        r = session.post(f"{API}/subscriptions/{sid}/simulate-payment", json={}, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        updated = r.json()["subscription"]
        assert updated.get("lastPaymentDate")
        assert updated.get("renewalDate")

        # Delete
        r = session.delete(f"{API}/subscriptions/{sid}", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        # Verify deletion
        r = session.put(f"{API}/subscriptions/{sid}", json={"cost": 1}, headers=auth_headers, timeout=15)
        assert r.status_code == 404

    def test_create_validation(self, session, auth_headers):
        r = session.post(f"{API}/subscriptions", json={"serviceName": "X"}, headers=auth_headers, timeout=15)
        assert r.status_code == 400


# -------- Dashboard --------
class TestDashboard:
    def test_stats_shape(self, session, auth_headers):
        # Seed one sub to ensure non-empty data
        r = session.post(f"{API}/subscriptions", json={
            "serviceName": "TEST_Spotify", "cost": 9.99, "billingCycle": "monthly",
            "renewalDate": "2026-02-10", "category": "Music", "status": "active"
        }, headers=auth_headers, timeout=15)
        assert r.status_code == 201
        sid = r.json()["subscription"]["_id"]

        try:
            r = session.get(f"{API}/dashboard/stats", headers=auth_headers, timeout=15)
            assert r.status_code == 200
            body = r.json()
            assert {"kpis", "upcoming", "charts", "budget"}.issubset(body.keys())
            assert {"totalMonthly", "totalYearly", "activeCount", "totalCount", "upcomingCount"}.issubset(body["kpis"].keys())
            assert {"categoryBreakdown", "monthly", "trend"}.issubset(body["charts"].keys())
            assert isinstance(body["charts"]["monthly"], list) and len(body["charts"]["monthly"]) == 6
            assert isinstance(body["charts"]["trend"], list) and len(body["charts"]["trend"]) == 6
            assert "amount" in body["budget"] and "usedPct" in body["budget"]
            assert body["kpis"]["totalMonthly"] >= 9.99
        finally:
            session.delete(f"{API}/subscriptions/{sid}", headers=auth_headers, timeout=15)


# -------- Notifications --------
class TestNotifications:
    def test_list_and_read_all(self, session, auth_headers):
        # create one sub to generate a notification
        r = session.post(f"{API}/subscriptions", json={
            "serviceName": "TEST_NotifTrigger", "cost": 1.0, "billingCycle": "monthly",
            "renewalDate": "2026-03-01", "category": "Other", "status": "active"
        }, headers=auth_headers, timeout=15)
        assert r.status_code == 201
        sid = r.json()["subscription"]["_id"]

        try:
            r = session.get(f"{API}/notifications", headers=auth_headers, timeout=15)
            assert r.status_code == 200
            body = r.json()
            assert "notifications" in body and isinstance(body["notifications"], list)
            assert len(body["notifications"]) >= 1

            r2 = session.put(f"{API}/notifications/read-all", headers=auth_headers, timeout=15)
            assert r2.status_code == 200

            # delete first notification
            nid = body["notifications"][0].get("_id") or body["notifications"][0].get("id")
            r3 = session.delete(f"{API}/notifications/{nid}", headers=auth_headers, timeout=15)
            assert r3.status_code in (200, 204)
        finally:
            session.delete(f"{API}/subscriptions/{sid}", headers=auth_headers, timeout=15)


# -------- Profile --------
class TestProfile:
    def test_update_profile_and_password(self, session, auth_headers):
        # Update name + monthly budget
        r = session.put(f"{API}/profile", json={"name": "Test User", "monthlyBudget": 50}, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        u = body.get("user") or body
        assert u.get("monthlyBudget") == 50
        assert u.get("name") == "Test User"

        # Verify via /auth/me
        r = session.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["user"].get("monthlyBudget") == 50

        # Wrong current password
        r = session.put(f"{API}/profile/password",
                        json={"currentPassword": "wrong", "newPassword": "abcdef1"},
                        headers=auth_headers, timeout=15)
        assert r.status_code in (400, 401, 403)


# -------- Email --------
class TestEmail:
    def test_email_test_endpoint_reachable(self, session, auth_headers):
        r = session.post(f"{API}/email/test", json={"email": TEST_EMAIL}, headers=auth_headers, timeout=30)
        # 200 = sent OK; 502 = Resend rejected (acceptable per spec)
        assert r.status_code in (200, 502), f"Unexpected status {r.status_code}: {r.text}"
        body = r.json()
        if r.status_code == 200:
            assert body.get("id") or body.get("ok") is True
        else:
            assert "detail" in body or "error" in body or "message" in body

    def test_email_test_unauthorized(self):
        r = requests.post(f"{API}/email/test", json={"email": TEST_EMAIL}, timeout=15)
        assert r.status_code == 401
