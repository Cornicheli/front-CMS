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

  // 24 cells for the animated screen grid
  readonly screenCells = Array.from({ length: 24 }, (_, i) => i);

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

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
