import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CreateProductDto, ProductService, UpdateProductDto } from '../../services/product.service';
import {
  CreateRawMaterialDto,
  RawMaterialService,
  UpdateRawMaterialDto,
} from '../../services/raw-material.service';
import {
  ApiProductRawMaterial,
  CreateProductRawMaterialDto,
  ProductRawMaterialService,
} from '../../services/product-raw-material.service';
import {
  ProductionService,
  ApiProductionSuggestion,
  ApiProductionResponse,
} from '../../services/production.service';

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number | null;
  rawMaterials: RawMaterialAssociation[];
}

export interface RawMaterialAssociation {
  rawMaterialId: string;
  quantity: number;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  stock: number | null;
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
  providers: [ProductService, RawMaterialService, ProductRawMaterialService, ProductionService],
})
export class ProductsComponent implements OnInit {
  activeTab: 'products' | 'rawMaterials' | 'production' = 'products';
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  productsLoaded = false;
  rawMaterialsLoaded = false;

  showProductModal = false;
  showRawMaterialModal = false;
  showConfirmModal = false;
  editingProduct: Product | null = null;
  editingRawMaterial: RawMaterial | null = null;

  confirmAction: (() => void) | null = null;
  confirmTitle = '';
  confirmMessage = '';

  productForm: Product = this.getEmptyProduct();
  rawMaterialForm: RawMaterial = this.getEmptyRawMaterial();

  rawMaterials: RawMaterial[] = [];
  products: Product[] = [];

  productionSuggestions: ProductionSuggestion[] = [];

  constructor(
    private productService: ProductService,
    private rawMaterialService: RawMaterialService,
    private productRawMaterialService: ProductRawMaterialService,
    private productionService: ProductionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadRawMaterials();
  }

  loadProducts() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      products: this.productService.getAll(),
      associations: this.productRawMaterialService.getAll(),
    }).subscribe({
      next: ({ products: apiProducts, associations }) => {
        const associationsByProduct = new Map<string, ApiProductRawMaterial[]>();
        associations.forEach((assoc) => {
          if (!associationsByProduct.has(assoc.productId)) {
            associationsByProduct.set(assoc.productId, []);
          }
          associationsByProduct.get(assoc.productId)!.push(assoc);
        });

        this.products = apiProducts
          .map((apiProd) => {
            const productAssociations = associationsByProduct.get(apiProd.id) || [];
            return {
              id: apiProd.id,
              code: apiProd.code,
              name: apiProd.name,
              price: apiProd.price,
              rawMaterials: productAssociations.map((assoc) => ({
                rawMaterialId: assoc.rawMaterialId,
                quantity: assoc.quantityRequired,
              })),
            };
          })
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        this.productsLoaded = true;
        this.isLoading = false;
        this.checkAndLoadProductionSuggestions();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Erro ao carregar produtos';
        this.productsLoaded = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadRawMaterials() {
    this.isLoading = true;
    this.errorMessage = '';
    this.rawMaterialService.getAll().subscribe({
      next: (apiRawMaterials) => {
        this.rawMaterials = apiRawMaterials
          .map((apiRm) => ({
            id: apiRm.id,
            code: apiRm.code,
            name: apiRm.name,
            stock: apiRm.quantityInStock,
          }))
          .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        this.rawMaterialsLoaded = true;
        this.isLoading = false;
        this.checkAndLoadProductionSuggestions();
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erro ao carregar matérias-primas';
        this.rawMaterialsLoaded = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get isProductionTabEnabled(): boolean {
    return this.productsLoaded && this.rawMaterialsLoaded;
  }

  private checkAndLoadProductionSuggestions() {
    if (this.isProductionTabEnabled) {
      this.loadProductionSuggestions();
    }
  }

  loadProductionSuggestions() {
    if (this.products.length === 0 || this.rawMaterials.length === 0) {
      this.productionSuggestions = [];
      return;
    }

    this.productionService.getSuggestions().subscribe({
      next: (response: ApiProductionResponse) => {
        this.productionSuggestions = this.mapApiSuggestionsToLocal(response.suggestions);
        this.cdr.detectChanges();
      },
      error: () => {
        this.productionSuggestions = [];
        this.cdr.detectChanges();
      },
    });
  }

  mapApiSuggestionsToLocal(apiSuggestions: ApiProductionSuggestion[]): ProductionSuggestion[] {
    return apiSuggestions
      .filter((apiSuggestion) => apiSuggestion.productId && apiSuggestion.productCode)
      .map((apiSuggestion) => {
        let product = this.products.find((p) => p.id === apiSuggestion.productId);
        if (!product) {
          product = this.products.find((p) => p.code === apiSuggestion.productCode);
        }
        if (!product) {
          product = {
            id: apiSuggestion.productId,
            code: apiSuggestion.productCode,
            name: apiSuggestion.productName,
            price: apiSuggestion.productPrice,
            rawMaterials: [],
          };
        }

        const rawMaterialsUsed =
          product.rawMaterials
            .map((assoc) => {
              const rawMaterial = this.rawMaterials.find((rm) => rm.id === assoc.rawMaterialId);
              return rawMaterial
                ? {
                    rawMaterial,
                    quantityUsed: (assoc.quantity || 0) * apiSuggestion.quantityToProduce,
                  }
                : null;
            })
            .filter(
              (item): item is { rawMaterial: RawMaterial; quantityUsed: number } => item !== null,
            ) || [];

        return {
          product,
          maxQuantity: apiSuggestion.quantityToProduce,
          totalValue: apiSuggestion.totalValue,
          rawMaterialsUsed,
        };
      });
  }

  formatForDisplay(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    if (Number.isInteger(value)) {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } else {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });
    }
  }

  formatNumberForAPI(value: number | null | undefined): number {
    if (value === null || value === undefined || isNaN(value)) {
      return 0.0;
    }
    return parseFloat(value.toFixed(2));
  }

  formatCurrency(value: number | null | undefined): string {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  setActiveTab(tab: 'products' | 'rawMaterials' | 'production') {
    if (tab === 'production' && !this.isProductionTabEnabled) {
      return;
    }

    this.activeTab = tab;
    if (tab === 'production') {
      this.loadProductionSuggestions();
    }
    this.cdr.detectChanges();
  }

  get filteredProducts() {
    if (!this.searchTerm) return this.products;
    const filtered = this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
    return filtered.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }

  get filteredRawMaterials() {
    if (!this.searchTerm) return this.rawMaterials;
    const filtered = this.rawMaterials.filter(
      (rm) =>
        rm.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        rm.code.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
    return filtered.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }

  openNewProductModal() {
    this.editingProduct = null;
    this.productForm = this.getEmptyProduct();
    this.productForm.code = this.generateNextProductCode();
    this.showProductModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  openEditProductModal(product: Product) {
    this.editingProduct = product;
    this.productForm = JSON.parse(JSON.stringify(product));
    this.showProductModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  saveProduct() {
    if (!this.editingProduct) {
      if (!this.isProductFormValid()) {
        this.errorMessage = 'Preencha todos os campos obrigatórios corretamente';
        this.cdr.detectChanges();
        return;
      }
    }

    const price =
      this.productForm.price !== null && this.productForm.price !== undefined
        ? this.productForm.price
        : this.editingProduct?.price || 0;

    const name = this.productForm.name || this.editingProduct?.name || '';
    const code = this.productForm.code || this.editingProduct?.code || '';

    const priceForAPI = this.formatNumberForAPI(price);

    if (this.editingProduct) {
      const updateData: UpdateProductDto = {
        code: code,
        name: name,
        price: priceForAPI,
      };

      this.productService
        .update(this.editingProduct.id, updateData)
        .pipe(
          switchMap((updatedProduct) => {
            return this.saveProductRawMaterials(updatedProduct.id, true).pipe(
              switchMap(() => of(updatedProduct)),
            );
          }),
        )
        .subscribe({
          next: (updatedProduct) => {
            const index = this.products.findIndex((p) => p.id === updatedProduct.id);
            if (index !== -1) {
              this.products[index] = {
                id: updatedProduct.id,
                code: updatedProduct.code,
                name: updatedProduct.name,
                price: updatedProduct.price,
                rawMaterials: this.productForm.rawMaterials,
              };
              this.products.sort((a, b) =>
                a.code.localeCompare(b.code, undefined, { numeric: true }),
              );
            }
            this.closeProductModal();
            if (this.activeTab === 'production') {
              this.loadProductionSuggestions();
            }
          },
          error: () => {
            this.errorMessage = 'Erro ao atualizar produto';
            this.cdr.detectChanges();
          },
        });
    } else {
      const createData: CreateProductDto = {
        code: code,
        name: name,
        price: priceForAPI,
      };

      this.productService
        .create(createData)
        .pipe(
          switchMap((newProduct) => {
            return this.saveProductRawMaterials(newProduct.id, false).pipe(
              switchMap(() => of(newProduct)),
            );
          }),
        )
        .subscribe({
          next: (newProduct) => {
            this.products.push({
              id: newProduct.id,
              code: newProduct.code,
              name: newProduct.name,
              price: newProduct.price,
              rawMaterials: this.productForm.rawMaterials,
            });
            this.products.sort((a, b) =>
              a.code.localeCompare(b.code, undefined, { numeric: true }),
            );
            this.closeProductModal();
            if (this.activeTab === 'production') {
              this.loadProductionSuggestions();
            }
          },
          error: () => {
            this.errorMessage = 'Erro ao criar produto';
            this.cdr.detectChanges();
          },
        });
    }
  }

  private saveProductRawMaterials(productId: string, isEditing: boolean = false) {
    const validRawMaterials = this.productForm.rawMaterials.filter(
      (rm) => rm.rawMaterialId && rm.quantity > 0,
    );

    const deleteOldAssociations$ = isEditing
      ? this.productRawMaterialService.deleteByProduct(productId).pipe(
          catchError(() => {
            return of(null);
          }),
        )
      : of(null);

    return deleteOldAssociations$.pipe(
      switchMap(() => {
        if (validRawMaterials.length === 0) {
          return of(null);
        }

        const saveRequests = validRawMaterials.map((rm) => {
          const dto: CreateProductRawMaterialDto = {
            productId: productId,
            rawMaterialId: rm.rawMaterialId,
            quantityRequired: rm.quantity,
          };
          return this.productRawMaterialService.create(dto).pipe(
            catchError(() => {
              return of(null);
            }),
          );
        });

        return forkJoin(saveRequests);
      }),
    );
  }

  isProductFormValid(): boolean {
    const hasName = !!this.productForm.name?.trim();
    const hasCode = !!this.productForm.code?.trim();
    const hasValidPrice =
      this.productForm.price !== null &&
      this.productForm.price !== undefined &&
      this.productForm.price >= 0;
    return hasName && hasCode && hasValidPrice;
  }

  deleteProduct(product: Product) {
    this.confirmTitle = 'Excluir Produto';
    this.confirmMessage = `Deseja realmente excluir o produto "${product.name}"?`;
    this.confirmAction = () => {
      this.productService.delete(product.id).subscribe({
        next: () => {
          this.products = this.products.filter((p) => p.id !== product.id);
          this.closeConfirmModal();
          this.cdr.detectChanges();
          if (this.activeTab === 'production') {
            this.loadProductionSuggestions();
          }
        },
        error: () => {
          this.errorMessage = 'Erro ao excluir produto';
          this.closeConfirmModal();
          this.cdr.detectChanges();
        },
      });
    };
    this.showConfirmModal = true;
    this.cdr.detectChanges();
  }

  closeProductModal(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showProductModal = false;
    this.editingProduct = null;
    this.productForm = this.getEmptyProduct();
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  openNewRawMaterialModal() {
    this.editingRawMaterial = null;
    this.rawMaterialForm = this.getEmptyRawMaterial();
    this.rawMaterialForm.code = this.generateNextRawMaterialCode();
    this.showRawMaterialModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  openEditRawMaterialModal(rawMaterial: RawMaterial) {
    this.editingRawMaterial = rawMaterial;
    this.rawMaterialForm = JSON.parse(JSON.stringify(rawMaterial));
    this.showRawMaterialModal = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  saveRawMaterial() {
    if (!this.editingRawMaterial) {
      if (!this.isRawMaterialFormValid()) {
        this.errorMessage = 'Preencha todos os campos obrigatórios corretamente';
        this.cdr.detectChanges();
        return;
      }
    }

    const stock =
      this.rawMaterialForm.stock !== null && this.rawMaterialForm.stock !== undefined
        ? this.rawMaterialForm.stock
        : this.editingRawMaterial?.stock || 0;

    const name = this.rawMaterialForm.name || this.editingRawMaterial?.name || '';
    const code = this.rawMaterialForm.code || this.editingRawMaterial?.code || '';

    const stockForAPI = this.formatNumberForAPI(stock);

    if (this.editingRawMaterial) {
      const updateData: UpdateRawMaterialDto = {
        code: code,
        name: name,
        quantityInStock: stockForAPI,
      };

      this.rawMaterialService.update(this.editingRawMaterial.id, updateData).subscribe({
        next: (updatedRawMaterial) => {
          const index = this.rawMaterials.findIndex((rm) => rm.id === updatedRawMaterial.id);
          if (index !== -1) {
            this.rawMaterials[index] = {
              id: updatedRawMaterial.id,
              code: updatedRawMaterial.code,
              name: updatedRawMaterial.name,
              stock: updatedRawMaterial.quantityInStock,
            };
            this.rawMaterials.sort((a, b) =>
              a.code.localeCompare(b.code, undefined, { numeric: true }),
            );
          }
          this.closeRawMaterialModal();
          if (this.activeTab === 'production') {
            this.loadProductionSuggestions();
          }
        },
        error: () => {
          this.errorMessage = 'Erro ao atualizar matéria-prima';
          this.cdr.detectChanges();
        },
      });
    } else {
      const createData: CreateRawMaterialDto = {
        code: code,
        name: name,
        quantityInStock: stockForAPI,
      };

      this.rawMaterialService.create(createData).subscribe({
        next: (newRawMaterial) => {
          this.rawMaterials.push({
            id: newRawMaterial.id,
            code: newRawMaterial.code,
            name: newRawMaterial.name,
            stock: newRawMaterial.quantityInStock,
          });
          this.rawMaterials.sort((a, b) =>
            a.code.localeCompare(b.code, undefined, { numeric: true }),
          );
          this.closeRawMaterialModal();
          if (this.activeTab === 'production') {
            this.loadProductionSuggestions();
          }
        },
        error: () => {
          this.errorMessage = 'Erro ao criar matéria-prima';
          this.cdr.detectChanges();
        },
      });
    }
  }

  isRawMaterialFormValid(): boolean {
    const hasName = !!this.rawMaterialForm.name?.trim();
    const hasCode = !!this.rawMaterialForm.code?.trim();
    const stockValue = this.rawMaterialForm.stock;
    const hasValidStock =
      stockValue !== null && stockValue !== undefined && !isNaN(stockValue) && stockValue >= 0;
    return hasName && hasCode && hasValidStock;
  }

  deleteRawMaterial(rawMaterial: RawMaterial) {
    this.confirmTitle = 'Excluir Matéria-Prima';
    this.confirmMessage = `Deseja realmente excluir a matéria-prima "${rawMaterial.name}"?`;
    this.confirmAction = () => {
      this.rawMaterialService.delete(rawMaterial.id).subscribe({
        next: () => {
          this.rawMaterials = this.rawMaterials.filter((rm) => rm.id !== rawMaterial.id);
          this.closeConfirmModal();
          this.cdr.detectChanges();
          if (this.activeTab === 'production') {
            this.loadProductionSuggestions();
          }
        },
        error: () => {
          this.errorMessage = 'Erro ao excluir matéria-prima';
          this.closeConfirmModal();
          this.cdr.detectChanges();
        },
      });
    };
    this.showConfirmModal = true;
    this.cdr.detectChanges();
  }

  closeRawMaterialModal(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showRawMaterialModal = false;
    this.editingRawMaterial = null;
    this.rawMaterialForm = this.getEmptyRawMaterial();
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  closeConfirmModal(event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.confirmTitle = '';
    this.confirmMessage = '';
    this.cdr.markForCheck();
  }

  confirmDelete() {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  addRawMaterialToProduct() {
    this.productForm.rawMaterials.push({ rawMaterialId: '', quantity: 0 });
    this.cdr.detectChanges();
  }

  removeRawMaterialFromProduct(index: number) {
    this.productForm.rawMaterials.splice(index, 1);
    this.cdr.detectChanges();
  }

  getTotalProductionValue(): number {
    return this.productionSuggestions.reduce((sum, s) => sum + s.totalValue, 0);
  }

  private getEmptyProduct(): Product {
    return {
      id: '',
      code: '',
      name: '',
      price: null as any,
      rawMaterials: [],
    };
  }

  private getEmptyRawMaterial(): RawMaterial {
    return {
      id: '',
      code: '',
      name: '',
      stock: null as any,
    };
  }

  private generateNextProductCode(): string {
    const prefix = 'PROD';
    const existingCodes = this.products
      .map((p) => p.code)
      .filter((code) => code.startsWith(prefix))
      .map((code) => {
        const numberPart = code.replace(prefix, '');
        const number = parseInt(numberPart, 10);
        return isNaN(number) ? 0 : number;
      });

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const nextNumber = maxNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  private generateNextRawMaterialCode(): string {
    const prefix = 'MP';
    const existingCodes = this.rawMaterials
      .map((rm) => rm.code)
      .filter((code) => code.startsWith(prefix))
      .map((code) => {
        const numberPart = code.replace(prefix, '');
        const number = parseInt(numberPart, 10);
        return isNaN(number) ? 0 : number;
      });

    const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    const nextNumber = maxNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }
}
