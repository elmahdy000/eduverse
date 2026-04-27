import * as XLSX from 'xlsx';

export interface BarMenuItem {
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
}

export async function readBarMenuFromExcel(filePath: string): Promise<BarMenuItem[]> {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const menuItems: BarMenuItem[] = jsonData.map((row: any) => ({
      name: row['name'] || row['الاسم'] || row['Item Name'] || '',
      category: row['category'] || row['الفئة'] || row['Category'] || 'other',
      price: parseFloat(row['price'] || row['السعر'] || row['Price'] || '0'),
      description: row['description'] || row['الوصف'] || row['Description'] || undefined,
      image: row['image'] || row['صورة'] || row['Image'] || undefined,
    }));
    
    return menuItems;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

export function formatBarMenuForDisplay(items: BarMenuItem[]) {
  const categories = [...new Set(items.map(item => item.category))];
  
  return categories.map(category => ({
    category,
    items: items.filter(item => item.category === category),
  }));
}
