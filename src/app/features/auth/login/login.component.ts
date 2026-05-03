import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  form,
  FormField,
  submit,
  required,
  minLength,
} from '@angular/forms/signals';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly currentYear = new Date().getFullYear();
  readonly liveTime = signal(new Date().toTimeString().slice(0, 8));
  readonly rememberMe = signal(false);

  readonly miniMapLines = Array.from({ length: 14 }, (_, i) => i);
  readonly miniZones = [
    { id: 'centro',  x: 40, y: 55, screens: 8, color: 'oklch(0.65 0.16 270)' },
    { id: 'palermo', x: 30, y: 30, screens: 5, color: 'oklch(0.65 0.16 290)' },
    { id: 'retiro',  x: 50, y: 42, screens: 3, color: 'oklch(0.65 0.16 305)' },
    { id: 'pmadero', x: 70, y: 50, screens: 4, color: 'oklch(0.65 0.16 200)' },
    { id: 'telmo',   x: 55, y: 72, screens: 2, color: 'oklch(0.65 0.16 225)' },
  ];

  readonly model = signal({ username: '', password: '' });

  readonly loginForm = form(this.model, (s) => {
    required(s.username, { message: 'Usuario requerido' });
    minLength(s.username, 3, { message: 'Mínimo 3 caracteres' });
    required(s.password, { message: 'Contraseña requerida' });
    minLength(s.password, 6, { message: 'Mínimo 6 caracteres' });
  });

  onSubmit(): void {
    this.errorMessage.set(null);
    submit(this.loginForm, async () => {
      this.isLoading.set(true);
      try {
        await firstValueFrom(this.authService.login(this.model()));
        await this.router.navigate(['/dashboard']);
      } catch {
        this.errorMessage.set('Credenciales inválidas. Verificá usuario y contraseña.');
        this.isLoading.set(false);
      }
    });
  }

  constructor() {
    setInterval(() => this.liveTime.set(new Date().toTimeString().slice(0, 8)), 1000);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
