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
  MapPin,
  CheckCircle2,
  Fish,
  Waves,
  TrendingUp,
  Package,
  RefreshCw,
  Loader2,
} from "lucide-react";

// ข้อมูลสินค้าของปัน
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
  const [activeTab, setActiveTab] = useState("shop"); // 'shop', 'cart', 'admin'
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  // สถานะการโหลดข้อมูลออนไลน์
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // ข้อมูลลูกค้าสำหรับการสั่งซื้อ
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    team: "",
  });
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ลิงก์ API ของ SheetDB (เชื่อมต่อ Google Sheets ของคุณเอม)
  const API_URL = "https://sheetdb.io/api/v1/zn3opz1fmobg0";

  // ฟังก์ชันดึงข้อมูลจาก Google Sheets
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      // แปลงข้อมูลจาก Sheet กลับมาเป็นรูปแบบที่ระบบหลังร้านเข้าใจ
      const formattedOrders = data
        .map((row) => ({
          id: row.id,
          date: row.date,
          customer: { name: row.name, team: row.team, phone: row.phone },
          total: Number(row.total),
          items: row.items ? JSON.parse(row.items) : [],
        }))
        .reverse(); // ให้คิวล่าสุดอยู่บนสุด

      setOrders(formattedOrders);
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลได้:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // ดึงข้อมูลครั้งแรกเมื่อเปิดแอป
  useEffect(() => {
    fetchOrders();
  }, []);

  // โหลดข้อมูลใหม่เมื่อกดเข้าหน้าหลังร้าน
  useEffect(() => {
    if (activeTab === "admin") {
      fetchOrders();
    }
  }, [activeTab]);

  // ฟังก์ชันจัดการตะกร้าสินค้า
  const addToCart = (product) => {
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

  const updateQty = (id, delta) => {
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
    ); // ลบสินค้าออกจากตะกร้าถ้าจำนวนเหลือน้อยกว่า 1
  };

  const setSpecificQty = (id, value) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (value === "") return { ...item, qty: "" }; // อนุญาตให้ลบเลขชั่วคราวเวลาพิมพ์
          const newQty = parseInt(value, 10);
          return !isNaN(newQty) && newQty >= 0
            ? { ...item, qty: newQty }
            : item;
        }
        return item;
      })
    );
  };

  const handleQtyBlur = (id) => {
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

  const removeFromCart = (id) => {
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

  // ฟังก์ชันยืนยันการสั่งซื้อ (ส่งขึ้น Google Sheets)
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("ตะกร้าสินค้าว่างเปล่าครับ");
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.team)
      return alert("กรุณากรอกชื่อ เบอร์โทรศัพท์ และเลือกทีมด้วยนะครับ");

    setIsSubmitting(true); // เปิดสถานะกำลังโหลด

    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("th-TH"),
      customer: customerInfo,
      items: [...cart],
      total: cartTotal,
      status: "รอจัดส่ง",
    };

    // ฟังก์ชันช่วยดึงจำนวนและคำนวณราคาแต่ละเมนู
    const getQty = (id) => cart.find((i) => i.id === id)?.qty || "";
    const getPrice = (id) => {
      const item = cart.find((i) => i.id === id);
      return item ? item.qty * item.price : "";
    };

    // จัดเตรียมข้อมูลให้ตรงกับหัวคอลัมน์ใน Google Sheets
    const sheetData = {
      id: newOrder.id,
      date: newOrder.date,
      name: customerInfo.name,
      team: customerInfo.team,
      phone: customerInfo.phone,
      total: newOrder.total,
      items: JSON.stringify(cart), // (อย่าลบ) แนะนำให้ 'ซ่อนคอลัมน์' นี้ใน Excel แทน เพราะระบบหลังบ้านยังต้องใช้คำนวณ

      // --- เพิ่มคอลัมน์ใหม่ เพื่อให้อ่านใน Google Sheets ง่ายขึ้น ---
      summary: cart.map((item) => `${item.name} x${item.qty}`).join(", "), // สรุปรายการแบบอ่านง่ายในช่องเดียว
      item1_crab: getQty(1), // จำนวนปูนึ่ง
      price1_crab: getPrice(1), // ยอดเงินปูนึ่ง
      item2_fish: getQty(2), // จำนวนปลา
      price2_fish: getPrice(2), // ยอดเงินปลา
      item3_squid: getQty(3), // จำนวนหมึก
      price3_squid: getPrice(3), // ยอดเงินหมึก
      item4_dumpling: getQty(4), // จำนวนเกี๊ยว
      price4_dumpling: getPrice(4), // ยอดเงินเกี๊ยว
      item5_crabegg: getQty(5), // จำนวนปูไข่ดอง
      price5_crabegg: getPrice(5), // ยอดเงินปูไข่ดอง
    };

    try {
      // ส่งข้อมูลไปที่ SheetDB
      await fetch(API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: [sheetData] }),
      });

      setOrders([newOrder, ...orders]); // อัปเดตหน้าจอล่าสุดทันที
      setCart([]);
      setCustomerInfo({ name: "", phone: "", team: "" });
      setOrderSuccess(true);
      setActiveTab("shop");

      // ซ่อนข้อความสำเร็จหลังจาก 3 วินาที
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้งนะคะ");
      console.error(error);
    } finally {
      setIsSubmitting(false); // ปิดสถานะกำลังโหลด
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 font-sans text-sky-950 pb-20 md:pb-0">
      {/* Header */}
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
              PunPun's Seafood <span className="text-sky-400">🌊</span>
            </h1>
          </div>

          <div className="flex gap-2 md:gap-4">
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-medium transition-colors ${
                activeTab === "admin"
                  ? "bg-sky-800 text-white"
                  : "text-sky-600 hover:bg-sky-100"
              }`}
            >
              <ClipboardList size={20} />
              <span className="hidden md:inline">หลังร้าน (ปัน)</span>
            </button>

            <button
              onClick={() => setActiveTab("cart")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-medium transition-colors relative ${
                activeTab === "cart"
                  ? "bg-sky-800 text-white"
                  : "bg-sky-100 text-sky-800 hover:bg-sky-200"
              }`}
            >
              <ShoppingCart size={20} />
              <span className="hidden md:inline">ตะกร้า</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* แจ้งเตือนสั่งซื้อสำเร็จ */}
        {orderSuccess && (
          <div className="mb-6 bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in-down">
            <CheckCircle2 className="text-emerald-500" />
            <p className="font-medium">
              รับออเดอร์เรียบร้อยแล้ว ขอบคุณที่อุดหนุนนะครับ! 💙
            </p>
          </div>
        )}

        {/* --- โหมดหน้าร้าน (Shop) --- */}
        {activeTab === "shop" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-sky-900 mb-2">
                อาหารทะเลสดใหม่ พร้อมส่งถึงมือคุณ 🦀
              </h2>
              <p className="text-sky-600">
                เลือกเมนูที่ถูกใจแล้วกดใส่ตะกร้าได้เลยครับ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-5 rounded-3xl shadow-sm border border-sky-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group"
                >
                  <div
                    className={`w-24 h-24 flex items-center justify-center text-5xl rounded-full mb-4 ${product.color} group-hover:scale-110 transition-transform`}
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
                          className="text-sky-500 hover:text-sky-700 p-1"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={
                            cart.find((item) => item.id === product.id)?.qty
                          }
                          onChange={(e) =>
                            setSpecificQty(product.id, e.target.value)
                          }
                          onBlur={() => handleQtyBlur(product.id)}
                          className="w-10 text-center font-bold text-sky-900 bg-transparent border-none focus:ring-0 p-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQty(product.id, 1)}
                          className="text-sky-500 hover:text-sky-700 p-1"
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

        {/* --- โหมดตะกร้าสินค้า (Cart & Checkout) --- */}
        {activeTab === "cart" && (
          <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-sky-900 mb-6 flex items-center gap-2">
              <ShoppingCart /> ตะกร้าสินค้าของคุณ
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-sky-400">
                <Waves size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">ยังไม่มีสินค้าในตะกร้าเลยครับ</p>
                <button
                  onClick={() => setActiveTab("shop")}
                  className="mt-4 text-sky-600 font-medium underline"
                >
                  กลับไปเลือกซื้อสินค้า
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-10">
                {/* รายการสินค้า */}
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
                        <h4 className="font-bold text-sky-900 leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-sky-600 text-sm">฿{item.price}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-full border border-sky-200">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="text-sky-400 hover:text-sky-600 p-1"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) =>
                            setSpecificQty(item.id, e.target.value)
                          }
                          onBlur={() => handleQtyBlur(item.id)}
                          className="w-10 text-center font-bold text-sky-900 bg-transparent border-none focus:ring-0 p-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="text-sky-400 hover:text-sky-600 p-1"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-rose-400 hover:text-rose-600 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-sky-100 flex justify-between items-center text-xl">
                    <span className="font-medium text-sky-700">
                      ยอดรวมทั้งสิ้น
                    </span>
                    <span className="font-bold text-sky-900">
                      ฿{cartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ฟอร์มข้อมูลลูกค้า */}
                <form
                  onSubmit={handleCheckout}
                  className="bg-sky-50 p-6 rounded-3xl space-y-4"
                >
                  <h3 className="font-bold text-sky-900 text-lg mb-4">
                    ข้อมูลจัดส่ง 📍
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-sky-700 mb-1 pl-1">
                      ชื่อลูกค้า
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-3 text-sky-400"
                        size={18}
                      />
                      <input
                        required
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-sky-400 shadow-sm"
                        placeholder="ชื่อลูกค้า"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sky-700 mb-1 pl-1">
                      ทีม (Team)
                    </label>
                    <div className="relative">
                      <Users
                        className="absolute left-3 top-3 text-sky-400"
                        size={18}
                      />
                      <select
                        required
                        value={customerInfo.team}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            team: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-sky-400 shadow-sm appearance-none bg-white text-sky-900"
                      >
                        <option value="" disabled>
                          เลือกทีม...
                        </option>
                        <option value="Team A">Team A</option>
                        <option value="Team B">Team B</option>
                        <option value="Team C">Team C</option>
                        <option value="Team D">Team D</option>
                        <option value="Team E">Team E</option>
                        <option value="Team F">Team F</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sky-700 mb-1 pl-1">
                      เบอร์โทรศัพท์
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-3 text-sky-400"
                        size={18}
                      />
                      <input
                        required
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none focus:ring-2 focus:ring-sky-400 shadow-sm"
                        placeholder="08X-XXX-XXXX"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white font-bold text-lg py-3.5 rounded-xl shadow-lg transition-all mt-6 flex justify-center items-center gap-2 ${
                      isSubmitting
                        ? "bg-sky-400 cursor-not-allowed"
                        : "bg-sky-500 hover:bg-sky-600 shadow-sky-200"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />{" "}
                        กำลังส่งออเดอร์...
                      </>
                    ) : (
                      "ยืนยันการสั่งซื้อ"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* --- โหมดหลังร้าน (Admin Dashboard) --- */}
        {activeTab === "admin" &&
          (() => {
            // คำนวณสรุปยอดขายทั้งหมด
            const totalRevenue = orders.reduce(
              (sum, order) => sum + order.total,
              0
            );
            const totalItemsSold = orders.reduce(
              (sum, order) =>
                sum +
                order.items.reduce((itemSum, item) => itemSum + item.qty, 0),
              0
            );

            // คำนวณสรุปแยกตามรายสินค้า
            const productStats = {};
            orders.forEach((order) => {
              order.items.forEach((item) => {
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
              (a, b) => b.totalQty - a.totalQty
            );

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-2 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-sky-900">
                      หลังร้านของปัน 📝
                    </h2>
                    <p className="text-sky-600">
                      สรุปยอดขายและรายการออเดอร์ทั้งหมด
                    </p>
                  </div>
                  <button
                    onClick={fetchOrders}
                    disabled={isLoadingOrders}
                    className="flex items-center gap-2 bg-white border border-sky-200 text-sky-700 px-4 py-2 rounded-xl hover:bg-sky-50 transition-colors shadow-sm disabled:opacity-50 text-sm font-medium"
                  >
                    <RefreshCw
                      size={16}
                      className={isLoadingOrders ? "animate-spin" : ""}
                    />
                    {isLoadingOrders ? "กำลังอัปเดต..." : "รีเฟรชข้อมูล"}
                  </button>
                </div>

                {/* การ์ดสรุปยอดรวม */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-sky-400 to-sky-500 p-5 rounded-2xl text-white shadow-md">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                      <TrendingUp size={20} />
                      <span className="font-medium text-sm md:text-base">
                        ยอดขายรวมทั้งหมด
                      </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold">
                      ฿{totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 p-5 rounded-2xl text-white shadow-md">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                      <Package size={20} />
                      <span className="font-medium text-sm md:text-base">
                        จำนวนสินค้าทั้งหมด
                      </span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold">
                      {totalItemsSold}{" "}
                      <span className="text-base md:text-lg font-normal">
                        ชิ้น
                      </span>
                    </div>
                  </div>
                </div>

                {/* สรุปจำนวนสินค้าที่ต้องเตรียม */}
                {summaryList.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-5 mb-8">
                    <h3 className="font-bold text-sky-900 mb-4 flex items-center gap-2">
                      <Fish size={18} className="text-sky-500" />{" "}
                      สรุปรายการอาหารที่ต้องเตรียม
                    </h3>
                    <div className="space-y-3">
                      {summaryList.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center border-b border-sky-50 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl bg-sky-50 w-10 h-10 flex items-center justify-center rounded-full">
                              {item.icon}
                            </span>
                            <span className="font-medium text-sky-800">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-right flex items-center gap-3 md:gap-6">
                            <span className="text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full text-sm">
                              {item.totalQty} กล่อง/แพ็ค
                            </span>
                            <span className="text-sky-600 font-bold w-20 text-right">
                              ฿{item.totalRevenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* รายการออเดอร์ */}
                <div>
                  <h3 className="font-bold text-sky-900 mb-4 text-lg border-b border-sky-200 pb-2">
                    รายการออเดอร์ล่าสุด
                  </h3>
                  {isLoadingOrders && orders.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-12 text-center text-sky-400 flex flex-col items-center">
                      <Loader2
                        size={48}
                        className="animate-spin mx-auto mb-4 opacity-50"
                      />
                      <p className="text-lg">กำลังโหลดออเดอร์จากระบบ...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-12 text-center text-sky-400">
                      <ClipboardList
                        size={48}
                        className="mx-auto mb-4 opacity-50"
                      />
                      <p className="text-lg">
                        ยังไม่มีออเดอร์เข้ามาเลยครับ รอสักครู่นะครับ ✌️
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-sky-100"
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 pb-4 border-b border-sky-50">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded font-bold">
                                  ออเดอร์ #{order.id.toString().slice(-4)}
                                </span>
                                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-bold">
                                  {order.customer.team}
                                </span>
                                <span className="text-sm text-sky-500">
                                  {order.date}
                                </span>
                              </div>
                              <h4 className="font-bold text-lg text-sky-900 flex items-center gap-2 mt-2">
                                <User size={16} className="text-sky-400" />{" "}
                                {order.customer.name}
                              </h4>
                              <p className="text-sm text-sky-600 flex items-center gap-2 mt-1">
                                <Phone size={14} className="text-sky-400" />{" "}
                                {order.customer.phone}
                              </p>
                            </div>
                            <div className="text-left md:text-right bg-sky-50 p-3 rounded-xl">
                              <p className="text-sm text-sky-600 mb-1">
                                ยอดรวมออเดอร์นี้
                              </p>
                              <p className="text-2xl font-bold text-sky-600">
                                ฿{order.total.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-bold text-sky-800 mb-2">
                              รายการที่สั่ง:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white border border-sky-100 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 shadow-sm"
                                >
                                  <span>{item.icon}</span>
                                  <span className="font-medium text-sky-800">
                                    {item.name}
                                  </span>
                                  <span className="text-sky-500">
                                    x{item.qty}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
      </main>

      {/* Mobile Bottom Navigation (Optional for better mobile UX) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sky-100 p-3 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab("shop")}
          className={`flex flex-col items-center gap-1 p-2 ${
            activeTab === "shop" ? "text-sky-600" : "text-sky-300"
          }`}
        >
          <Store size={24} />
          <span className="text-[10px] font-medium">หน้าร้าน</span>
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex flex-col items-center gap-1 p-2 relative ${
            activeTab === "cart" ? "text-sky-600" : "text-sky-300"
          }`}
        >
          <ShoppingCart size={24} />
          <span className="text-[10px] font-medium">ตะกร้า</span>
          {cartItemCount > 0 && (
            <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center gap-1 p-2 ${
            activeTab === "admin" ? "text-sky-600" : "text-sky-300"
          }`}
        >
          <ClipboardList size={24} />
          <span className="text-[10px] font-medium">หลังร้าน</span>
        </button>
      </nav>
    </div>
  );
}
