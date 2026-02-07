import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Models
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

export interface RawMaterial {
  id: number;
  name: string;
  description: string;
  unit: string;
  stock: number;
}

export interface ProductionSuggestion {
  product: Product;
  maxQuantity: number;
  totalValue: number;
  rawMaterialsUsed: { rawMaterial: RawMaterial; quantityUsed: number }[];
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent {
  // Estado atual da aplicação
  activeTab: 'products' | 'rawMaterials' | 'production' = 'products';
  searchTerm = '';

  // Modal states
  showProductModal = false;
  showRawMaterialModal = false;
  editingProduct: Product | null = null;
  editingRawMaterial: RawMaterial | null = null;

  // Form data
  productForm: Product = this.getEmptyProduct();
  rawMaterialForm: RawMaterial = this.getEmptyRawMaterial();

  // Dados mockados - Matérias-primas
  rawMaterials: RawMaterial[] = [
    { id: 1, name: 'Farinha de Trigo', description: 'Farinha tipo 1', unit: 'kg', stock: 50 },
    { id: 2, name: 'Açúcar', description: 'Açúcar refinado', unit: 'kg', stock: 30 },
    { id: 3, name: 'Ovos', description: 'Ovos frescos', unit: 'unidade', stock: 100 },
    { id: 4, name: 'Manteiga', description: 'Manteiga sem sal', unit: 'kg', stock: 15 },
    { id: 5, name: 'Chocolate em Pó', description: 'Cacau 50%', unit: 'kg', stock: 10 },
    { id: 6, name: 'Fermento Biológico', description: 'Fermento fresco', unit: 'kg', stock: 5 },
    { id: 7, name: 'Sal', description: 'Sal refinado', unit: 'kg', stock: 20 },
    { id: 8, name: 'Leite', description: 'Leite integral', unit: 'litro', stock: 25 },
  ];

  // Dados mockados - Produtos
  products: Product[] = [
    {
      id: 1,
      name: 'Bolo de Chocolate',
      description: 'Bolo tradicional de chocolate',
      price: 45.0,
      rawMaterials: [
        { rawMaterialId: 1, quantity: 0.5 }, // Farinha
        { rawMaterialId: 2, quantity: 0.3 }, // Açúcar
        { rawMaterialId: 3, quantity: 4 }, // Ovos
        { rawMaterialId: 4, quantity: 0.2 }, // Manteiga
        { rawMaterialId: 5, quantity: 0.2 }, // Chocolate
      ],
    },
    {
      id: 2,
      name: 'Pão Caseiro',
      description: 'Pão artesanal tradicional',
      price: 12.0,
      rawMaterials: [
        { rawMaterialId: 1, quantity: 1.0 }, // Farinha
        { rawMaterialId: 6, quantity: 0.05 }, // Fermento
        { rawMaterialId: 7, quantity: 0.02 }, // Sal
      ],
    },
    {
      id: 3,
      name: 'Biscoito Amanteigado',
      description: 'Biscoito de manteiga crocante',
      price: 18.0,
      rawMaterials: [
        { rawMaterialId: 1, quantity: 0.4 }, // Farinha
        { rawMaterialId: 2, quantity: 0.2 }, // Açúcar
        { rawMaterialId: 4, quantity: 0.3 }, // Manteiga
        { rawMaterialId: 3, quantity: 2 }, // Ovos
      ],
    },
  ];

  // Production suggestions
  productionSuggestions: ProductionSuggestion[] = [];

  constructor() {
    this.calculateProductionSuggestions();
  }

  // Tab navigation
  setActiveTab(tab: 'products' | 'rawMaterials' | 'production') {
    this.activeTab = tab;
    if (tab === 'production') {
      this.calculateProductionSuggestions();
    }
  }

  // Filtros
  get filteredProducts() {
    if (!this.searchTerm) return this.products;
    return this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
  }

  get filteredRawMaterials() {
    if (!this.searchTerm) return this.rawMaterials;
    return this.rawMaterials.filter(
      (rm) =>
        rm.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        rm.description.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
  }

  // CRUD - Products
  openNewProductModal() {
    this.editingProduct = null;
    this.productForm = this.getEmptyProduct();
    this.showProductModal = true;
  }

  openEditProductModal(product: Product) {
    this.editingProduct = product;
    this.productForm = JSON.parse(JSON.stringify(product));
    this.showProductModal = true;
  }

  saveProduct() {
    if (this.editingProduct) {
      const index = this.products.findIndex((p) => p.id === this.editingProduct!.id);
      if (index !== -1) {
        this.products[index] = { ...this.productForm };
      }
    } else {
      const newId = Math.max(...this.products.map((p) => p.id), 0) + 1;
      this.products.push({ ...this.productForm, id: newId });
    }
    this.closeProductModal();
  }

  deleteProduct(product: Product) {
    if (confirm(`Deseja realmente excluir o produto "${product.name}"?`)) {
      this.products = this.products.filter((p) => p.id !== product.id);
    }
  }

  closeProductModal() {
    this.showProductModal = false;
    this.editingProduct = null;
    this.productForm = this.getEmptyProduct();
  }

  // CRUD - Raw Materials
  openNewRawMaterialModal() {
    this.editingRawMaterial = null;
    this.rawMaterialForm = this.getEmptyRawMaterial();
    this.showRawMaterialModal = true;
  }

  openEditRawMaterialModal(rawMaterial: RawMaterial) {
    this.editingRawMaterial = rawMaterial;
    this.rawMaterialForm = JSON.parse(JSON.stringify(rawMaterial));
    this.showRawMaterialModal = true;
  }

  saveRawMaterial() {
    if (this.editingRawMaterial) {
      const index = this.rawMaterials.findIndex((rm) => rm.id === this.editingRawMaterial!.id);
      if (index !== -1) {
        this.rawMaterials[index] = { ...this.rawMaterialForm };
      }
    } else {
      const newId = Math.max(...this.rawMaterials.map((rm) => rm.id), 0) + 1;
      this.rawMaterials.push({ ...this.rawMaterialForm, id: newId });
    }
    this.closeRawMaterialModal();
  }

  deleteRawMaterial(rawMaterial: RawMaterial) {
    if (confirm(`Deseja realmente excluir a matéria-prima "${rawMaterial.name}"?`)) {
      this.rawMaterials = this.rawMaterials.filter((rm) => rm.id !== rawMaterial.id);
    }
  }

  closeRawMaterialModal() {
    this.showRawMaterialModal = false;
    this.editingRawMaterial = null;
    this.rawMaterialForm = this.getEmptyRawMaterial();
  }

  // Product Raw Materials Management
  addRawMaterialToProduct() {
    this.productForm.rawMaterials.push({ rawMaterialId: 0, quantity: 0 });
  }

  removeRawMaterialFromProduct(index: number) {
    this.productForm.rawMaterials.splice(index, 1);
  }

  getRawMaterialName(id: number): string {
    const rm = this.rawMaterials.find((r) => r.id === id);
    return rm ? rm.name : 'Selecione...';
  }

  getRawMaterialUnit(id: number): string {
    const rm = this.rawMaterials.find((r) => r.id === id);
    return rm ? rm.unit : '';
  }

  // Production Analysis
  calculateProductionSuggestions() {
    const suggestions: ProductionSuggestion[] = [];
    const sortedProducts = [...this.products].sort((a, b) => b.price - a.price);
    const availableStock = new Map<number, number>();

    this.rawMaterials.forEach((rm) => {
      availableStock.set(rm.id, rm.stock);
    });

    for (const product of sortedProducts) {
      const maxQuantity = this.calculateMaxProductionQuantity(product, availableStock);

      if (maxQuantity > 0) {
        const rawMaterialsUsed: { rawMaterial: RawMaterial; quantityUsed: number }[] = [];

        product.rawMaterials.forEach((assoc) => {
          const currentStock = availableStock.get(assoc.rawMaterialId) || 0;
          const quantityUsed = assoc.quantity * maxQuantity;
          availableStock.set(assoc.rawMaterialId, currentStock - quantityUsed);

          const rm = this.rawMaterials.find((r) => r.id === assoc.rawMaterialId)!;
          rawMaterialsUsed.push({ rawMaterial: rm, quantityUsed });
        });

        suggestions.push({
          product,
          maxQuantity,
          totalValue: product.price * maxQuantity,
          rawMaterialsUsed,
        });
      }
    }

    this.productionSuggestions = suggestions;
  }

  calculateMaxProductionQuantity(product: Product, availableStock: Map<number, number>): number {
    let maxQuantity = Infinity;

    for (const assoc of product.rawMaterials) {
      const available = availableStock.get(assoc.rawMaterialId) || 0;
      const possibleQuantity = Math.floor(available / assoc.quantity);
      maxQuantity = Math.min(maxQuantity, possibleQuantity);
    }

    return maxQuantity === Infinity ? 0 : maxQuantity;
  }

  getTotalProductionValue(): number {
    return this.productionSuggestions.reduce((sum, s) => sum + s.totalValue, 0);
  }

  private getEmptyProduct(): Product {
    return {
      id: 0,
      name: '',
      description: '',
      price: 0,
      rawMaterials: [],
    };
  }

  private getEmptyRawMaterial(): RawMaterial {
    return {
      id: 0,
      name: '',
      description: '',
      unit: '',
      stock: 0,
    };
  }
}
