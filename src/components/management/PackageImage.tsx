// src/components/management/PackageImage.tsx
import React, { useState } from "react";

interface PackageImageProps {
  src?: string;
  alt: string;
  className?: string; // Pass classes like rounded-circle
  style?: React.CSSProperties; // Pass styles like width, height
}

// Reusable Fallback Component (can be customized)
const ImageFallback = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`d-flex align-items-center justify-content-center bg-light text-muted ${
      className || ""
    }`}
    style={{ width: "40px", height: "40px", ...style }} // Default size, can be overridden by style prop
  >
    <i className="fas fa-image" style={{ fontSize: "1.2rem" }}></i>
  </div>
);

const PackageImage: React.FC<PackageImageProps> = ({
  src,
  alt,
  className,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const defaultStyle: React.CSSProperties = {
    height: "40px",
    width: "40px",
    objectFit: "cover",
    ...style, // Allow overriding defaults
  };

  // If there's no src or if an error occurred loading the src, show fallback
  if (!src || hasError) {
    return <ImageFallback className={className} style={defaultStyle} />;
  }

  // Otherwise, try to render the image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={defaultStyle}
      onError={() => setHasError(true)} // Set error state if image fails to load
    />
  );
};

export default PackageImage;
