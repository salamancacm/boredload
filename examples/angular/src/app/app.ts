import { Component, signal } from '@angular/core';
import { BoredloadGameDirective } from 'boredload/angular';

@Component({
  selector: 'app-root',
  imports: [BoredloadGameDirective],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly isLoading = signal(true);
  protected readonly dismissed = signal(false);

  protected simulateLoad(): void {
    this.dismissed.set(false);
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 3000);
  }

  protected onExit(): void {
    this.dismissed.set(true);
  }
}
