import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiRawMaterial {
  id: string;
  code: string;
  name: string;
  quantityInStock: number;
}

export interface CreateRawMaterialDto {
  code: string;
  name: string;
  quantityInStock: number;
}

export interface UpdateRawMaterialDto {
  code?: string;
  name?: string;
  quantityInStock?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RawMaterialService {
  private apiUrl = '/api/raw-materials';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiRawMaterial[]> {
    return this.http.get<ApiRawMaterial[]>(this.apiUrl);
  }

  getById(id: string): Observable<ApiRawMaterial> {
    return this.http.get<ApiRawMaterial>(`${this.apiUrl}/${id}`);
  }

  create(rawMaterial: CreateRawMaterialDto): Observable<ApiRawMaterial> {
    return this.http.post<ApiRawMaterial>(this.apiUrl, rawMaterial);
  }

  update(id: string, rawMaterial: UpdateRawMaterialDto): Observable<ApiRawMaterial> {
    return this.http.put<ApiRawMaterial>(`${this.apiUrl}/${id}`, rawMaterial);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
