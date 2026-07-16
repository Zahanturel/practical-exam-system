import type { Constraint } from "../../lib/types";

interface Props {
  constraints: Constraint[];
  onChange: (constraints: Constraint[]) => void;
}

export default function ConstraintEditor({ constraints, onChange }: Props) {
  const addConstraint = () => {
    const next: Constraint = {
      index: constraints.length,
      label: `Variant ${String.fromCharCode(65 + constraints.length)}`,
      description: "",
    };
    onChange([...constraints, next]);
  };

  const updateConstraint = (index: number, field: keyof Constraint, value: string | number) => {
    const updated = constraints.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    onChange(updated);
  };

  const removeConstraint = (index: number) => {
    const updated = constraints
      .filter((_, i) => i !== index)
      .map((c, i) => ({ ...c, index: i }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Constraint Variations ({constraints.length})
        </h3>
        <button
          onClick={addConstraint}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Constraint
        </button>
      </div>

      {constraints.length < 2 && (
        <p className="text-xs text-amber-600">Minimum 2 constraints required. Currently: {constraints.length}</p>
      )}

      <div className="space-y-3">
        {constraints.map((constraint, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <input
                type="text"
                value={constraint.label}
                onChange={(e) => updateConstraint(i, "label", e.target.value)}
                className="text-sm font-medium bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
              />
              <button
                onClick={() => removeConstraint(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <textarea
              value={constraint.description}
              onChange={(e) => updateConstraint(i, "description", e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
