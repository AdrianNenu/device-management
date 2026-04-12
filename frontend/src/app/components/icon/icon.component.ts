import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// All SVG paths in one place — components reference icons by name, never inline SVG.
const ICONS: Record<string, string> = {
  devices:       'M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm1 0v7h10V3H3zm2 9h6v1H5v-1z',
  all:           'M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z',
  assigned:      'M8 1a4 4 0 100 8A4 4 0 008 1zM3 8a5 5 0 1110 0A5 5 0 013 8zm5 5a5 5 0 00-4.546 2.916A.5.5 0 004 16h8a.5.5 0 00.546-.084A5 5 0 008 13z',
  available:     'M8 1a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 9c3.314 0 6 1.343 6 3v1H2v-1c0-1.657 2.686-3 6-3z',
  phone:         'M5 1a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 001-1V2a1 1 0 00-1-1H5zm3 12a.75.75 0 110 1.5A.75.75 0 018 13z',
  tablet:        'M2 3a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm1 0v10h10V3H3zm3 7H5v1h1v-1zm2 0H7v1h1v-1zm2 0H9v1h1v-1z',
  logout:        'M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6',
  search:        '', // uses circle+path below
  add:           'M8 3v10M3 8h10',
  edit:          'M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z',
  delete:        'M3 4h10M5 4V2h6v2M6 7v5M10 7v5M4 4l1 10h6l1-10',
  close:         'M3 3l10 10M13 3L3 13',
  back:          'M10 3L5 8l5 5',
  assign:        'M8 5v6m-3-3h6',
  unassign:      'M4 8h8',
  'person-add':  'M11 8a3 3 0 110-6 3 3 0 010 6zm-9 8a6 6 0 0112 0H2zm13-8v6m-3-3h6',
  ai:            'M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.36 11.36l1.42 1.42M3.22 12.78l1.41-1.41M11.36 4.64l1.42-1.42',
  mobile:        'M3 1h10a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm5 13a.75.75 0 110 1.5.75.75 0 010-1.5z',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.viewBox]="'0 0 16 16'"
         [attr.width]="size"
         [attr.height]="size"
         fill="none"
         [attr.stroke]="fill ? 'none' : 'currentColor'"
         [attr.fill]="fill ? 'currentColor' : 'none'"
         stroke-width="1.5"
         aria-hidden="true">
      <ng-container *ngIf="name === 'search'">
        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/>
        <path d="M11 11l2.5 2.5" stroke="currentColor" stroke-width="1.5"/>
      </ng-container>
      <path *ngIf="name !== 'search'" [attr.d]="iconPath" [attr.stroke-width]="strokeWidth"/>
    </svg>
  `
})
export class IconComponent {
  @Input() name  = '';
  @Input() size  = 16;
  @Input() fill  = false;
  @Input() strokeWidth = 1.5;

  get iconPath(): string { return ICONS[this.name] ?? ''; }
}