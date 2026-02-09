import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface CreateProductRawMaterialDto {
  productId: string;
  rawMaterialId: string;
  quantityRequired: number;
}

export interface ApiProductRawMaterial {
  id: string;
  productId: string;
  productName: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantityRequired: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductRawMaterialService {
  private apiUrl = '/api/product-raw-materials';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiProductRawMaterial[]> {
    return this.http.get<ApiProductRawMaterial[]>(this.apiUrl);
  }

  getByProductId(productId: string): Observable<ApiProductRawMaterial[]> {
    return this.getAll().pipe(
      map((associations) => associations.filter((a) => a.productId === productId)),
    );
  }

  create(dto: CreateProductRawMaterialDto): Observable<ApiProductRawMaterial> {
    return this.http.post<ApiProductRawMaterial>(this.apiUrl, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteByProduct(productId: string): Observable<void> {
    return this.getByProductId(productId).pipe(
      switchMap((associations) => {
        if (associations.length === 0) {
          return of(undefined as void);
        }
        const deleteRequests = associations.map((assoc) => this.delete(assoc.id));
        return forkJoin(deleteRequests).pipe(map(() => undefined as void));
      }),
    );
  }
}
