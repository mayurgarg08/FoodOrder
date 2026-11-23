import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl'
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) {
      return 'https://placehold.co/600x400/121212/D9381E?text=No+Image';
    }
    
    if (value.startsWith('http') || value.startsWith('data:image')) {
      return value;
    }
    
    // Check if it's an uploaded image starting with /
    if (value.startsWith('/')) {
      return `${environment.apiUrl}${value}`;
    }
    
    return `${environment.apiUrl}/${value}`;
  }
}
