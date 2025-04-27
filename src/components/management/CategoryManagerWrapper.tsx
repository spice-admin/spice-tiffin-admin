// src/components/management/CategoryManager.tsx
import React, { useRef } from "react";
import ManageCategoryModal from "./ManageCategoryModal";
import CategoryTable, { type CategoryTableHandle } from "./CategoryTable";

const CategoryManager: React.FC = () => {
  const tableRef = useRef<CategoryTableHandle>(null);

  const handleCategoryAdded = () => {
    tableRef.current?.refetch();
  };

  return (
    <>
      <CategoryTable ref={tableRef} />
      <ManageCategoryModal onCategoryAdded={handleCategoryAdded} />
    </>
  );
};

export default CategoryManager;
