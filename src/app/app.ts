import { Component, signal } from '@angular/core';
import { ProductsComponent } from './components/products/products.component';

@Component({
  selector: 'app-root',
  imports: [ProductsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('autoflex-frontend');
}
