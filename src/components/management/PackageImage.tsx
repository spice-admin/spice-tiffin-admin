import React, { useState } from "react";

interface PackageImageProps {
  src?: string | null; // Allow null
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

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
    style={{ width: "40px", height: "40px", ...style }}
  >
    <i className="fas fa-image" style={{ fontSize: "1.2rem" }}></i>{" "}
    {/* Ensure Font Awesome is available */}
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
    ...style,
  };

  if (!src || hasError) {
    return <ImageFallback className={className} style={defaultStyle} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={defaultStyle}
      onError={() => setHasError(true)}
    />
  );
};

export default PackageImage;
