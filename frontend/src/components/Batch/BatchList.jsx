import React, { useMemo } from "react";
import BatchCard from "../../ui/BatchCard";
import GenericFilter from "../../ui/GenericFilter";

const BatchList = ({ batches, onEdit, onDelete }) => {
  // Dynamically get unique departments from batches
  const uniqueDepartments = useMemo(() => {
    const departments = [
      ...new Set(batches.map((batch) => batch.department).filter(Boolean)),
    ];
    return departments.sort().map((dept) => ({
      label: dept.toUpperCase(),
      value: dept,
    }));
  }, [batches]);

  // Dynamically get unique years
  const uniqueYears = useMemo(() => {
    const years = [
      ...new Set(batches.map((batch) => batch.year).filter(Boolean)),
    ];
    return years.sort((a, b) => a - b);
  }, [batches]);

  // Dynamically get unique programs
  const uniquePrograms = useMemo(() => {
    const programs = [
      ...new Set(batches.map((batch) => batch.program).filter(Boolean)),
    ];
    return programs.sort();
  }, [batches]);

  // Render function for each batch card
  const renderBatchCard = (batch) => (
    <BatchCard batch={batch} onEdit={onEdit} onDelete={onDelete} />
  );

  // If no batches, show empty state
  if (batches.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-slate-900 animate-fade-in-up p-6 shadow-lg dark:shadow-none border border-gray-100 dark:border-slate-600 rounded-lg shadow-gray-600">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Batches
            <span className="text-sm font-medium bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full">
              0
            </span>
          </h2>
        </div>
        <div className="min-h-100 p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No batches exist. Click "Add Batch" to get started! 🚀
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-slate-900 animate-fade-in-up p-6 shadow-lg dark:shadow-none border border-gray-100 dark:border-slate-600 rounded-lg shadow-gray-600">
      <GenericFilter
        items={batches}
        filterConfig={[
          {
            key: "year",
            label: "Year",
            type: "select",
            options: uniqueYears,
          },
          {
            key: "program",
            label: "Program",
            type: "select",
            options: uniquePrograms,
          },
        ]}
        searchFields={["batch_name", "department", "program"]}
        quickFilters={uniqueDepartments}
        quickFilterKey="department"
        renderItem={renderBatchCard}
        title="Batches"
        searchPlaceholder="Search by batch name, department, or program..."
        emptyMessage="No batches found matching your criteria."
        itemsPerRow="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        containerClassName="p-0 bg-transparent"
      />
    </div>
  );
};

export default BatchList;
