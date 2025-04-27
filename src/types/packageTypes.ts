export type PackageType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  type: "trial" | "weekly" | "monthly";
  days: number;
  category: {
    _id: string;
    name: string;
  };
  image?: string;
  createdAt: string;
  updatedAt: string;
};
