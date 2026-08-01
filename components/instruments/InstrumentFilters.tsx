import Button from "@/components/ui/Button";
import {
  CONDITION_LABELS,
  INSTRUMENT_CONDITIONS,
  INSTRUMENT_STATUSES,
  STATUS_LABELS,
  type InstrumentCondition,
  type InstrumentStatus,
} from "@/types/instrument";

const SELECT_CLASSES =
  "mt-1.5 w-full rounded-sm border border-[#E8E8E8] bg-white px-3 py-2 text-sm text-[#111111] focus:border-[#C8A928] focus:outline-none";
const LABEL_CLASSES =
  "text-xs font-medium uppercase tracking-wide text-[#666666]";

export type FilterValue<T> = "all" | T;

interface InstrumentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: FilterValue<InstrumentStatus>;
  onStatusChange: (value: FilterValue<InstrumentStatus>) => void;
  condition: FilterValue<InstrumentCondition>;
  onConditionChange: (value: FilterValue<InstrumentCondition>) => void;
  category: FilterValue<string>;
  onCategoryChange: (value: FilterValue<string>) => void;
  categories: string[];
  hasActiveFilters: boolean;
  onReset: () => void;
}

export default function InstrumentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  condition,
  onConditionChange,
  category,
  onCategoryChange,
  categories,
  hasActiveFilters,
  onReset,
}: InstrumentFiltersProps) {
  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="instrument-search" className={LABEL_CLASSES}>
            Search
          </label>
          <input
            id="instrument-search"
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by code, name or category"
            className={SELECT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="instrument-status" className={LABEL_CLASSES}>
            Status
          </label>
          <select
            id="instrument-status"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as FilterValue<InstrumentStatus>)
            }
            className={SELECT_CLASSES}
          >
            <option value="all">All Statuses</option>
            {INSTRUMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="instrument-condition" className={LABEL_CLASSES}>
            Condition
          </label>
          <select
            id="instrument-condition"
            value={condition}
            onChange={(event) =>
              onConditionChange(
                event.target.value as FilterValue<InstrumentCondition>,
              )
            }
            className={SELECT_CLASSES}
          >
            <option value="all">All Conditions</option>
            {INSTRUMENT_CONDITIONS.map((value) => (
              <option key={value} value={value}>
                {CONDITION_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="instrument-category" className={LABEL_CLASSES}>
            Category
          </label>
          <select
            id="instrument-category"
            value={category}
            onChange={(event) =>
              onCategoryChange(event.target.value as FilterValue<string>)
            }
            className={SELECT_CLASSES}
          >
            <option value="all">All Categories</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="w-full lg:w-auto"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
