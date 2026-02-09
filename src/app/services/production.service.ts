import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiProductionSuggestion {
  productId: string;
  productCode: string;
  productName: string;
  productPrice: number;
  quantityToProduce: number;
  totalValue: number;
}

export interface ApiProductionResponse {
  suggestions: ApiProductionSuggestion[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private apiUrl = '/api/production';

  constructor(private http: HttpClient) {}

  getSuggestions(): Observable<ApiProductionResponse> {
    return this.http.get<ApiProductionResponse>(`${this.apiUrl}/suggestion`);
  }
}
