import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Store,
  ClipboardList,
  Plus,
  Minus,
  Trash2,
  User,
  Users,
  Phone,
  CheckCircle2,
  Fish,
  Waves,
  TrendingUp,
  Package,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ข้อมูลสินค้าของคุณเอม
const PRODUCTS = [
  {
    id: 1,
    name: "ปูนึ่งแกะพร้อมทาน",
    detail: "กล่องละ 1 กิโลกรัม",
    price: 530,
    icon: "🦀",
    color: "bg-orange-100",
  },
  {
    id: 2,
    name: "ปลาอินทรีย์แดดเดียว",
    detail: "แพ็คละ 500 กรัม",
    price: 320,
    icon: "🐟",
    color: "bg-blue-100",
  },
  {
    id: 3,
    name: "หมึกไข่แดดเดียว",
    detail: "แพ็คละ 500 กรัม",
    price: 260,
    icon: "🦑",
    color: "bg-purple-100",
  },
  {
    id: 4,
    name: "เกี๊ยวปลา",
    detail: "แพ็คละ 500 กรัม",
    price: 190,
    icon: "🥟",
    color: "bg-yellow-100",
  },
  {
    id: 5,
    name: "ปูไข่ดอง",
    detail: "แพ็คละ 3 ตัว",
    price: 410,
    icon: "🦀🥚",
    color: "bg-red-100",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("shop");
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    team: "",
  });
  const [orderSuccess, setOrderSuccess] = useState(false);

  const API_URL = "https://sheetdb.io/api/v1/zn3opz1fmobg0";

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      const formattedOrders = data
        .map((row: any) => ({
          id: row.id,
          date: row.date,
          customer: { name: row.name, team: row.team, phone: row.phone },
          total: Number(row.total),
          items: row.items ? JSON.parse(row.items) : [],
        }))
        .reverse();

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showError("ไม่สามารถโหลดข้อมูลได้ครับ");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchOrders();
    }
  }, [activeTab]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setOrderSuccess(false);
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const currentQty = Number(item.qty) || 0;
            return { ...item, qty: currentQty + delta };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const setSpecificQty = (id: number, value: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (value === "") return { ...item, qty: "" };
          const newQty = parseInt(value, 10);
          return !isNaN(newQty) && newQty >= 0
            ? { ...item, qty: newQty }
            : item;
        }
        return item;
      })
    );
  };

  const handleQtyBlur = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id && (item.qty === "" || item.qty === 0)) {
            return { ...item, qty: 0 };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * (Number(item.qty) || 0),
    0
  );
  const cartItemCount = cart.reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return showError("ตะกร้าสินค้าว่างเปล่าครับ");
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.team)
      return showError("กรุณากรอกข้อมูลให้ครบถ้วนนะครับ");

    setIsSubmitting(true);

    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("th-TH"),
      customer: customerInfo,
      items: [...cart],
      total: cartTotal,
      status: "รอจัดส่ง",
    };

    const getQty = (id: number) =>
      cart.find((i: any) => i.id === id)?.qty || "";
    const getPrice = (id: number) => {
      const item = cart.find((i: any) => i.id === id);
      return item ? item.qty * item.price : "";
    };

    const sheetData = {
      id: newOrder.id,
      date: newOrder.date,
      name: customerInfo.name,
      team: customerInfo.team,
      phone: customerInfo.phone,
      total: newOrder.total,
      items: JSON.stringify(cart),
      summary: cart.map((item: any) => `${item.name} x${item.qty}`).join(", "),
      item1_crab: getQty(1),
      price1_crab: getPrice(1),
      item2_fish: getQty(2),
      price2_fish: getPrice(2),
      item3_squid: getQty(3),
      price3_squid: getPrice(3),
      item4_dumpling: getQty(4),
      price4_dumpling: getPrice(4),
      item5_crabegg: getQty(5),
      price5_crabegg: getPrice(5),
    };

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [sheetData] }),
      });
      setOrders([newOrder, ...orders]);
      setCart([]);
      setCustomerInfo({ name: "", phone: "", team: "" });
      setOrderSuccess(true);
      setActiveTab("shop");
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      showError("เกิดข้อผิดพลาด กรุณาลองใหม่นะครับ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      await fetch(`${API_URL}/id/${orderId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (error) {
      showError("ไม่สามารถลบออเดอร์ได้ครับ");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 font-sans text-sky-950 pb-20 md:pb-0">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveTab("shop")}
          >
            <div className="bg-sky-400 p-2 rounded-full text-white">
              <Fish size={24} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-sky-800 tracking-tight">
              Aim's Seafood <span className="text-sky-400">🌊</span>
            </h1>
          </div>
          <div className="flex gap-2 md:gap-4">
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-medium ${
                activeTab === "admin"
                  ? "bg-sky-800 text-white"
                  : "text-sky-600 hover:bg-sky-100"
              }`}
            >
              <ClipboardList size={20} />
              <span className="hidden md:inline">หลังร้าน</span>
            </button>
            <button
              onClick={() => setActiveTab("cart")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-medium relative ${
                activeTab === "cart"
                  ? "bg-sky-800 text-white"
                  : "bg-sky-100 text-sky-800"
              } `}
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {errorMessage && (
          <div className="mb-6 bg-rose-100 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-bounce">
            <AlertCircle className="text-rose-500 flex-shrink-0" />
            <p className="font-medium text-sm">{errorMessage}</p>
          </div>
        )}
        {orderSuccess && (
          <div className="mb-6 bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" />
            <p className="font-medium">สั่งซื้อสำเร็จ! รอทานได้เลยครับ 💙</p>
          </div>
        )}

        {activeTab === "shop" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-5 rounded-3xl shadow-sm border border-sky-100 hover:shadow-md transition-all flex flex-col items-center text-center"
                >
                  <div
                    className={`w-24 h-24 flex items-center justify-center text-5xl rounded-full mb-4 ${product.color}`}
                  >
                    {product.icon}
                  </div>
                  <h3 className="font-bold text-lg text-sky-900">
                    {product.name}
                  </h3>
                  <p className="text-sm text-sky-500 mb-4">{product.detail}</p>
                  <div className="mt-auto w-full flex items-center justify-between">
                    <span className="text-xl font-bold text-sky-600">
                      ฿{product.price}
                    </span>
                    {cart.find((item) => item.id === product.id) ? (
                      <div className="flex items-center gap-1 bg-sky-50 px-2 py-1.5 rounded-full border border-sky-200">
                        <button
                          onClick={() => updateQty(product.id, -1)}
                          className="text-sky-500 p-1"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          value={
                            cart.find((item) => item.id === product.id)?.qty
                          }
                          onChange={(e) =>
                            setSpecificQty(product.id, e.target.value)
                          }
                          onBlur={() => handleQtyBlur(product.id)}
                          className="w-10 text-center font-bold text-sky-900 bg-transparent border-none focus:ring-0 p-0 text-sm"
                        />
                        <button
                          onClick={() => updateQty(product.id, 1)}
                          className="text-sky-500 p-1"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-sky-400 hover:bg-sky-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={18} />
                        <span className="text-sm">เพิ่ม</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cart" && (
          <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-6 flex items-center gap-2">
              <ShoppingCart /> ตะกร้าสินค้า
            </h2>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-sky-400">
                <Waves size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">ยังไม่มีสินค้าในตะกร้าครับ</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-sky-50/50 p-4 rounded-2xl border border-sky-100"
                    >
                      <div
                        className={`w-12 h-12 flex-shrink-0 flex items-center justify-center text-2xl rounded-full ${item.color}`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sky-900">{item.name}</h4>
                        <p className="text-sky-600 text-sm">฿{item.price}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-sky-200">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="text-sky-400"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            setSpecificQty(item.id, e.target.value)
                          }
                          onBlur={() => handleQtyBlur(item.id)}
                          className="w-10 text-center font-bold text-sky-900 bg-transparent border-none focus:ring-0 p-0"
                        />
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="text-sky-400"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <div className="pt-4 border-t flex justify-between items-center text-xl font-bold text-sky-900">
                    <span>รวมทั้งหมด</span>
                    <span>฿{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                <form
                  onSubmit={handleCheckout}
                  className="bg-sky-50 p-6 rounded-3xl space-y-4"
                >
                  <h3 className="font-bold text-sky-900 text-lg mb-4 underline">
                    ข้อมูลสั่งซื้อ 📍
                  </h3>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e: any) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border-none shadow-sm"
                    placeholder="ชื่อลูกค้า"
                  />
                  <select
                    required
                    value={customerInfo.team}
                    onChange={(e: any) =>
                      setCustomerInfo({ ...customerInfo, team: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border-none shadow-sm bg-white text-sky-900"
                  >
                    <option value="" disabled>
                      เลือกทีม...
                    </option>
                    {["A", "B", "C", "D", "E", "F"].map((t) => (
                      <option key={t} value={`Team ${t}`}>
                        Team {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e: any) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border-none shadow-sm"
                    placeholder="เบอร์โทรศัพท์"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white font-bold text-lg py-3.5 rounded-xl shadow-lg transition-all mt-4 ${
                      isSubmitting
                        ? "bg-sky-300"
                        : "bg-sky-500 hover:bg-sky-600"
                    }`}
                  >
                    {isSubmitting ? "กำลังส่งออเดอร์..." : "ยืนยันการสั่งซื้อ"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === "admin" &&
          (() => {
            const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
            const totalItemsSold = orders.reduce(
              (sum, o) =>
                sum + o.items.reduce((iS: any, i: any) => iS + i.qty, 0),
              0
            );

            const productStats: any = {};
            orders.forEach((order) => {
              order.items.forEach((item: any) => {
                if (!productStats[item.id]) {
                  productStats[item.id] = {
                    ...item,
                    totalQty: 0,
                    totalRevenue: 0,
                  };
                }
                productStats[item.id].totalQty += item.qty;
                productStats[item.id].totalRevenue += item.price * item.qty;
              });
            });

            const summaryList = Object.values(productStats).sort(
              (a: any, b: any) => b.totalQty - a.totalQty
            );

            return (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-sky-900">
                    หลังร้าน 📝
                  </h2>
                  <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 text-sky-600 bg-white px-4 py-2 rounded-xl shadow-sm"
                  >
                    <RefreshCw
                      size={16}
                      className={isLoadingOrders ? "animate-spin" : ""}
                    />
                    รีเฟรช
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-sky-500 p-5 rounded-2xl text-white shadow-md">
                    <p className="text-sm opacity-90">ยอดขายรวม</p>
                    <div className="text-2xl font-bold">
                      ฿{totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-emerald-500 p-5 rounded-2xl text-white shadow-md">
                    <p className="text-sm opacity-90">จำนวนสินค้า</p>
                    <div className="text-2xl font-bold">
                      {totalItemsSold} ชิ้น
                    </div>
                  </div>
                </div>

                {summaryList.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5 mb-8">
                    <h3 className="font-bold text-sky-900 mb-4 flex items-center gap-2">
                      <Fish size={18} className="text-sky-500" />{" "}
                      สรุปรายการอาหาร
                    </h3>
                    <div className="space-y-3">
                      {summaryList.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center border-b border-sky-50 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="font-medium text-sky-800">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className="text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full text-xs">
                              {item.totalQty} ชิ้น
                            </span>
                            <span className="text-sky-600 font-bold min-w-[70px]">
                              ฿{item.totalRevenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {isLoadingOrders && orders.length === 0 ? (
                    <p className="text-center text-sky-400">กำลังโหลด...</p>
                  ) : orders.length === 0 ? (
                    <p className="text-center text-sky-400">
                      ยังไม่มีออเดอร์ครับ
                    </p>
                  ) : (
                    orders.map((order: any) => (
                      <div
                        key={order.id}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-sky-100"
                      >
                        <div className="flex justify-between items-start border-b pb-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded font-bold">
                                {order.customer.team}
                              </span>
                              <span className="text-xs text-sky-400">
                                {order.date}
                              </span>
                            </div>
                            <h4 className="font-bold text-sky-900">
                              {order.customer.name} - {order.customer.phone}
                            </h4>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-sky-600">
                              ฿{order.total.toLocaleString()}
                            </div>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deletingId === order.id}
                              className="text-rose-400 text-xs mt-2 flex items-center gap-1 ml-auto"
                            >
                              {deletingId === order.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}{" "}
                              ลบ
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((it: any, idx: number) => (
                            <span
                              key={idx}
                              className="bg-sky-50 px-2 py-1 rounded-md text-sm text-sky-700"
                            >
                              {it.icon} {it.name} x{it.qty}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around items-center z-50">
        <button
          onClick={() => setActiveTab("shop")}
          className={`flex flex-col items-center gap-1 ${
            activeTab === "shop" ? "text-sky-600" : "text-sky-300"
          }`}
        >
          <Store size={24} />
          <span className="text-[10px]">หน้าร้าน</span>
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex flex-col items-center gap-1 relative ${
            activeTab === "cart" ? "text-sky-600" : "text-sky-300"
          }`}
        >
          <ShoppingCart size={24} />
          <span className="text-[10px]">ตะกร้า</span>
          {cartItemCount > 0 && (
            <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center gap-1 ${
            activeTab === "admin" ? "text-sky-600" : "text-sky-300"
          }`}
        >
          <ClipboardList size={24} />
          <span className="text-[10px]">หลังร้าน</span>
        </button>
      </nav>
    </div>
  );
}
