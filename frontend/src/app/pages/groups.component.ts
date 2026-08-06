import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Group } from '../models';
import { ShimmerComponent } from '../shared/shimmer.component';

@Component({
  selector: 'app-groups',
  imports: [RouterLink, FormsModule, ShimmerComponent],
  templateUrl: './groups.html',
  styleUrl: './groups.css',
})
export class GroupsComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);

  groups: Group[] = [];
  loading = true;
  error = '';

  createOpen = signal(false);
  name = '';
  description = '';
  color = '#7c3aed';
  colors = ['#7c3aed', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
  saving = false;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.api.get<{ groups: Group[] }>('/groups/').subscribe({
      next: (r) => {
        this.groups = r.groups;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggleJoin(g: Group): void {
    const req = g.is_member
      ? this.api.delete<{ group: Group }>(`/groups/${g.id}/join`)
      : this.api.post<{ group: Group }>(`/groups/${g.id}/join`);
    req.subscribe({
      next: (r) => {
        this.groups = this.groups.map((x) => (x.id === g.id ? r.group : x));
      },
      error: () => {},
    });
  }

  create(): void {
    const n = this.name.trim();
    if (n.length < 2 || this.saving) return;
    this.saving = true;
    this.error = '';
    this.api.post<{ group: Group }>('/groups/', {
      name: n,
      description: this.description.trim(),
      icon_color: this.color,
    }).subscribe({
      next: (r) => {
        this.groups = [r.group, ...this.groups];
        this.createOpen.set(false);
        this.name = '';
        this.description = '';
        this.saving = false;
      },
      error: (e) => {
        this.error = e.message;
        this.saving = false;
      },
    });
  }
}
