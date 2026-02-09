import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiProduct {
  id: string;
  code: string;
  name: string;
  price: number;
}

export interface CreateProductDto {
  code: string;
  name: string;
  price: number;
}

export interface UpdateProductDto {
  code?: string;
  name?: string;
  price?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = '/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiProduct[]> {
    return this.http.get<ApiProduct[]>(this.apiUrl);
  }

  getById(id: string): Observable<ApiProduct> {
    return this.http.get<ApiProduct>(`${this.apiUrl}/${id}`);
  }

  create(product: CreateProductDto): Observable<ApiProduct> {
    return this.http.post<ApiProduct>(this.apiUrl, product);
  }

  update(id: string, product: UpdateProductDto): Observable<ApiProduct> {
    return this.http.put<ApiProduct>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
