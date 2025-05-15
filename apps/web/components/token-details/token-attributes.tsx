import React from "react";

interface Attribute {
  trait_type: string;
  value: string;
}

interface TokenAttributesProps {
  attributes?: Attribute[];
}

export function TokenAttributes({ attributes }: TokenAttributesProps) {
  if (!attributes || attributes.length === 0) return null;
  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold mb-3 text-white">Attributes</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {attributes.map((attr, index) => (
          <div
            key={index}
            className="bg-black/40 border border-zinc-800/60 rounded-lg px-3 py-2"
          >
            <p className="text-zinc-400 text-xs">{attr.trait_type}</p>
            <p className="text-white font-medium">{attr.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
