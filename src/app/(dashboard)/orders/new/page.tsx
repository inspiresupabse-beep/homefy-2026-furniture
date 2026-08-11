"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LeadAddressFields } from "@/components/leads/lead-address-fields";
import { PageHeader } from "@/components/layout/page-header";
import { EMPTY_LEAD_ADDRESS, formatLeadAddress, type LeadAddress } from "@/lib/address";
import { STAFF_ROLES } from "@/lib/roles";
import { ORDER_STATUSES, type ProductLineItem, type Profile } from "@/lib/types/database";
import { Plus, Trash2 } from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = createClient();
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductLineItem[]>([
    { name: "", quantity: 1, unit_price: 0 },
  ]);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    discount: 0,
    advance_payment: 0,
    delivery_date: "",
    status: "pending",
    assigned_to: "",
  });
  const [address, setAddress] = useState<LeadAddress>(EMPTY_LEAD_ADDRESS);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .in("role", STAFF_ROLES)
      .then(({ data }) => {
      setAgents((data as Profile[]) ?? []);
    });
  }, [supabase]);

  const subtotal = products.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
  const total = Math.max(0, subtotal - form.discount);
  const balance = total - form.advance_payment;

  function updateProduct(index: number, field: keyof ProductLineItem, value: string | number) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: form.customer_name,
        phone: form.phone,
        address: formatLeadAddress(address),
        product_details: products.filter((p) => p.name),
        subtotal,
        discount: form.discount,
        total,
        advance_payment: form.advance_payment,
        delivery_date: form.delivery_date || null,
        status: form.status,
        assigned_to: form.assigned_to || null,
        created_by: user?.id ?? null,
        order_number: "",
      })
      .select("id")
      .single();

    setLoading(false);
    if (!error && data) router.push(`/orders/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <PageHeader
        title="New Order"
        description="Create a furniture order with product details & payment"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-900">Customer Details</h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <LeadAddressFields
                value={address}
                onChange={setAddress}
                title="Site / customer address"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-900">Product Details</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setProducts([...products, { name: "", quantity: 1, unit_price: 0 }])
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.map((product, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border border-stone-100 p-3 sm:grid-cols-12 sm:border-0 sm:p-0"
              >
                <div className="sm:col-span-5">
                  <Label className="sm:hidden">Product</Label>
                  <Input
                    placeholder="Product name"
                    value={product.name}
                    onChange={(e) => updateProduct(index, "name", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="sm:col-span-2">
                    <Label className="sm:hidden">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="sm:hidden">Unit price</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Unit price"
                      value={product.unit_price || ""}
                      onChange={(e) => updateProduct(index, "unit_price", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex items-center sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setProducts(products.filter((_, i) => i !== index))}
                    disabled={products.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-900">Payment & Delivery</h2>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Subtotal</Label>
              <Input value={`₹${subtotal.toLocaleString("en-IN")}`} disabled />
            </div>
            <div>
              <Label>Discount (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.discount || ""}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Total</Label>
              <Input value={`₹${total.toLocaleString("en-IN")}`} disabled className="font-semibold" />
            </div>
            <div>
              <Label>Advance Payment (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.advance_payment || ""}
                onChange={(e) => setForm({ ...form, advance_payment: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Balance Due</Label>
              <Input
                value={`₹${balance.toLocaleString("en-IN")}`}
                disabled
                className={balance > 0 ? "font-semibold text-amber-700" : "text-emerald-600"}
              />
            </div>
            <div>
              <Label>Delivery Date</Label>
              <Input
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.back()} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
