// src/components/InventoryDashboard.tsx
import { useEffect, useState } from 'react';
import api from '../axios';
import { InventoryItem } from '../types/Inventory';
import { InventorySection } from './InventorySection'; // ← Import

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustQty, setAdjustQty] = useState<{ [key: string]: string }>({});

  const handleAdjust = async (item: InventoryItem) => {
    const key = `${item.type}-${item.itemID}`;
    const input = adjustQty[key] || '0';
    const qty = parseFloat(input);
    if (isNaN(qty) || qty === 0) {
      alert('Enter a valid number');
      return;
    }

    const reason = qty > 0 ? 'Receipt' : 'Scrap';

    try {
      await api.post('/api/inventories/adjust', {
        itemID: item.itemID,
        itemType: item.type,
        location: 'Raw',
        quantity: qty,
        reason,
        note: `Manual ${reason.toLowerCase()} via dashboard`
      });
      const res = await api.get<InventoryItem[]>('/api/inventories/summary');
      setItems(res.data);
      setAdjustQty(prev => ({ ...prev, [key]: '' }));
    } catch (err: any) {
      alert(`Adjust failed: ${err.response?.data || err.message}`);
    }
  };

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get<InventoryItem[]>('/api/inventories/summary');
        setItems(res.data);
      } catch (err: any) {
        console.error('Inventory load failed:', err);
        alert(`Load failed: ${err.response?.status} ${err.response?.data || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  if (loading) return <p style={{ color: '#0f0' }}>Loading inventory...</p>;

  const materials = items.filter(i => i.type === 'Material');
  const colorants = items.filter(i => i.type === 'Colorant');
  const additives = items.filter(i => i.type === 'Additive');

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#0f0' }}>Inventory Summary</h2>

      <InventorySection title="Materials" items={materials} adjustQty={adjustQty} setAdjustQty={setAdjustQty} handleAdjust={handleAdjust} />
      <InventorySection title="Colorants" items={colorants} adjustQty={adjustQty} setAdjustQty={setAdjustQty} handleAdjust={handleAdjust} />
      <InventorySection title="Additives" items={additives} adjustQty={adjustQty} setAdjustQty={setAdjustQty} handleAdjust={handleAdjust} />
    </div>
  );
}