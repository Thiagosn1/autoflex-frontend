export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  rawMaterials: RawMaterialAssociation[];
}

export interface RawMaterialAssociation {
  rawMaterialId: number;
  quantity: number;
}
