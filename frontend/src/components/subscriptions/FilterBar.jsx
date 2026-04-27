import { Search } from "lucide-react";

export default function FilterBar({ filters, meta, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="surface p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              placeholder="Search by service..."
              className="field pl-9"
              value={filters.search}
              onChange={(e) => handleChange("search", e.target.value)}
              data-testid="filter-search-input"
            />
          </div>
        </div>
        <select
          className="field"
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          data-testid="filter-category-select"
        >
          <option value="all">All categories</option>
          {meta.categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          className="field"
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          data-testid="filter-status-select"
        >
          <option value="all">All statuses</option>
          {meta.statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select
          className="field"
          value={filters.sort}
          onChange={(e) => handleChange("sort", e.target.value)}
          data-testid="filter-sort-select"
        >
          <option value="renewal-asc">Renewal - soonest</option>
          <option value="renewal-desc">Renewal - latest</option>
          <option value="cost-desc">Cost - highest</option>
          <option value="cost-asc">Cost - lowest</option>
          <option value="name">Name (A-Z)</option>
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min $"
            className="field"
            value={filters.minCost}
            onChange={(e) => handleChange("minCost", e.target.value)}
            data-testid="filter-min-cost"
          />
          <input
            type="number"
            placeholder="Max $"
            className="field"
            value={filters.maxCost}
            onChange={(e) => handleChange("maxCost", e.target.value)}
            data-testid="filter-max-cost"
          />
        </div>
      </div>
    </div>
  );
}
