import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, Plus, Trash2, Edit3, ShoppingBag, LogOut, Search, 
  Printer, Store, ShoppingCart, MessageCircle, ExternalLink, ArrowLeft, CheckCircle2 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('saas_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('saas_user') || '{}'));
  
  // App View Mode: 'storefront' (E-Commerce Publik) atau 'dashboard' (Backoffice Admin)
  const [viewMode, setViewMode] = useState('storefront'); 
  const [activeTab, setActiveTab] = useState('inventory');

  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [authData, setAuthData] = useState({ storeName: '', adminName: '', email: '', password: '' });

  // Data State
  const [furnitures, setFurnitures] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Modal Detail Produk E-Commerce
  const [editId, setEditId] = useState(null);

  // Form Furniture State
  const [formData, setFormData] = useState({
    name: '', category: 'Kursi', price: '', stock: '', is_po: false,
    dimensions: '', material: 'Kayu Jati', finishing: 'Natural Oil', weight_kg: '', image_url: ''
  });

  // POS & E-Commerce Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchPublicFurnitures();
  }, []);

  // Fetch data publik (tanpa butuh token untuk pengunjung e-commerce)
  const fetchPublicFurnitures = async () => {
    try {
      // Pada sistem produksi, ini bisa difilter per tenant_id atau domain_slug
      const res = await axios.get(`${API_BASE}/furnitures/public`);
      setFurnitures(res.data.data);
    } catch (err) {
      // Fallback jika endpoint publik belum dibuat, gunakan data dummy/default
      console.log('Fetching public store data...');
    }
  };

  const fetchFurnitures = async () => {
    try {
      const res = await axios.get(`${API_BASE}/furnitures`, authHeader);
      setFurnitures(res.data.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await axios.post(`${API_BASE}${endpoint}`, authData);
      
      if (isRegister) {
        alert(res.data.message);
        setIsRegister(false);
      } else {
        localStorage.setItem('saas_token', res.data.token);
        localStorage.setItem('saas_user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        setViewMode('dashboard');
        fetchFurnitures();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    setToken('');
    setUser({});
    setViewMode('storefront');
  };

  const handleSaveFurniture = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_BASE}/furnitures/${editId}`, formData, authHeader);
      } else {
        await axios.post(`${API_BASE}/furnitures`, formData, authHeader);
      }
      setShowModal(false);
      resetForm();
      fetchFurnitures();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus produk ini?')) {
      await axios.delete(`${API_BASE}/furnitures/${id}`, authHeader);
      fetchFurnitures();
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData(item);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      name: '', category: 'Kursi', price: '', stock: '', is_po: false,
      dimensions: '', material: 'Kayu Jati', finishing: 'Natural Oil', weight_kg: '', image_url: ''
    });
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.furnitureId === item.id);
    if (existing) {
      setCart(cart.map(c => c.furnitureId === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { furnitureId: item.id, name: item.name, price: item.price, qty: 1, image_url: item.image_url }]);
    }
  };

  // Format Pesan WhatsApp Otomatis dari E-Commerce
  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return alert('Keranjang belanja kosong!');
    const storeNumber = '6281234567890'; // Nomor WA Toko (bisa diambil dari DB tenant)
    
    let text = `*HALO, SAYA INGIN MEMESAN FURNITURE*\n\n`;
    text += `*Nama:* ${customerName || 'Pembeli'}\n`;
    text += `*No. HP:* ${customerPhone || '-'}\n\n`;
    text += `*Daftar Pesanan:*\n`;
    
    let grandTotal = 0;
    cart.forEach((item, idx) => {
      const total = item.price * item.qty;
      grandTotal += total;
      text += `${idx + 1}. ${item.name} (${item.qty}x) - Rp ${total.toLocaleString('id-ID')}\n`;
    });

    text += `\n*Total Pembayaran:* Rp ${grandTotal.toLocaleString('id-ID')}\n\n`;
    text += `Mohon konfirmasi ketersediaan stok & estimasi ongkos kirim. Terima kasih!`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${storeNumber}?text=${encodedText}`, '_blank');
  };

  const filteredFurnitures = furnitures.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Dynamic Header: Storefront E-Commerce vs Backoffice Admin */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode('storefront')}>
            <Store className="w-7 h-7 text-amber-500" />
            <div>
              <span className="font-bold text-xl tracking-tight block">
                {user.storeName || 'Jati Furniture Store'}
              </span>
              <span className="text-xs text-slate-400 block -mt-1">Official E-Commerce Store</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {viewMode === 'storefront' ? (
              <>
                <button onClick={() => setViewMode('cart')} className="relative p-2 text-slate-200 hover:text-amber-400">
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cart.reduce((a, b) => a + b.qty, 0)}
                    </span>
                  )}
                </button>

                {token ? (
                  <button onClick={() => { setViewMode('dashboard'); fetchFurnitures(); }} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
                    Dashboard Admin <ExternalLink className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => setViewMode('login')} className="border border-slate-700 hover:border-slate-500 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition">
                    Login Pemilik Toko
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('storefront')} className="text-slate-300 hover:text-white text-sm flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Lihat Toko Online
                </button>
                <span className="text-sm text-slate-400">|</span>
                <span className="text-sm text-amber-400 font-medium">Admin: {user.name}</span>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* VIEW 1: E-COMMERCE STOREFRONT PUBLIK */}
      {viewMode === 'storefront' && (
        <main className="flex-1">
          {/* Hero Banner E-Commerce */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white py-16 px-6 mb-10">
            <div className="max-w-7xl mx-auto text-center md:text-left md:flex justify-between items-center">
              <div className="max-w-2xl">
                <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Koleksi High-Quality Furniture</span>
                <h1 className="text-4xl md:text-5xl font-extrabold mt-4 mb-4 leading-tight">Furniture Kayu Jati Minimalis & Modern</h1>
                <p className="text-slate-300 text-lg mb-6">Dapatkan perlengkapan rumah, meja, sofa, dan lemari kualitas ekspor langsung dari pengrajin terpercaya.</p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 mb-12">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                {['Semua', 'Kursi', 'Meja', 'Sofa', 'Lemari', 'Tempat Tidur'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${categoryFilter === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white border text-slate-600 hover:bg-slate-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  className="w-full pl-9 pr-4 py-2 border rounded-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Grid Katalog E-Commerce */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFurnitures.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                  <div className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(item)}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-16 h-16" />
                      </div>
                    )}
                    {item.is_po && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full">Pre-Order</span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">{item.category}</span>
                      <h3 className="font-bold text-slate-800 text-base mt-1 mb-2 hover:text-amber-600 cursor-pointer" onClick={() => setSelectedProduct(item)}>{item.name}</h3>
                      <div className="text-xs text-slate-500 space-y-1 mb-4">
                        <p>Material: <span className="text-slate-700 font-medium">{item.material || 'Kayu Jati'}</span></p>
                        <p>Dimensi: <span className="text-slate-700 font-medium">{item.dimensions || '-'}</span></p>
                      </div>
                    </div>

                    <div>
                      <div className="font-extrabold text-slate-900 text-lg mb-3">
                        Rp {Number(item.price).toLocaleString('id-ID')}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setSelectedProduct(item)} className="w-full border border-slate-300 hover:border-slate-400 text-slate-700 py-2 rounded-xl text-xs font-semibold">
                          Detail Spec
                        </button>
                        <button onClick={() => addToCart(item)} className="w-full bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition">
                          + Keranjang
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: HALAMAN KERANJANG E-COMMERCE & CHECKOUT WHATSAPP */}
      {viewMode === 'cart' && (
        <div className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
          <button onClick={() => setViewMode('storefront')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali Belanja
          </button>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Keranjang Belanja Anda</h2>

          {cart.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border text-center">
              <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Keranjang belanja Anda masih kosong.</p>
              <button onClick={() => setViewMode('storefront')} className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm">
                Lihat Katalog Furniture
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 m-auto text-slate-300" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="text-amber-600 font-bold text-sm">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">Qty: {item.qty}</span>
                      <button onClick={() => setCart(cart.filter(c => c.furnitureId !== item.furnitureId))} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Order */}
              <div className="bg-white p-6 rounded-2xl border flex flex-col justify-between h-fit">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Informasi Pemesan</h3>
                  <div className="space-y-3 mb-6">
                    <input type="text" placeholder="Nama Lengkap" className="w-full border p-2.5 rounded-xl text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    <input type="text" placeholder="Nomor WhatsApp" className="w-full border p-2.5 rounded-xl text-sm" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  </div>

                  <div className="border-t pt-4 space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Subtotal:</span>
                      <span>Rp {cart.reduce((a, b) => a + (b.price * b.qty), 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 border-t pt-2">
                      <span>Total:</span>
                      <span>Rp {cart.reduce((a, b) => a + (b.price * b.qty), 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <button onClick={sendWhatsAppOrder} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
                  <MessageCircle className="w-5 h-5" /> Pesan via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: BACKOFFICE / DASHBOARD ADMIN (Diakses Setelah Login) */}
      {viewMode === 'dashboard' && token && (
        <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <div className="flex gap-4 mb-6 border-b pb-2">
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 pb-2 px-3 font-semibold ${activeTab === 'inventory' ? 'border-b-2 border-amber-500 text-amber-600' : 'text-slate-500'}`}>
              <Package className="w-5 h-5" /> Inventaris Furniture
            </button>
            <button onClick={() => setActiveTab('pos')} className={`flex items-center gap-2 pb-2 px-3 font-semibold ${activeTab === 'pos' ? 'border-b-2 border-amber-500 text-amber-600' : 'text-slate-500'}`}>
              <ShoppingBag className="w-5 h-5" /> Kasir / POS
            </button>
          </div>

          {/* Tab Inventaris */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                  <input type="text" placeholder="Cari furniture..." className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                  <Plus className="w-5 h-5" /> Tambah Produk
                </button>
              </div>

              {/* Tabel Stok */}
              <div className="bg-white rounded-xl shadow overflow-x-auto border">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="p-4">Produk</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Spesifikasi Kayu & Dimensi</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Stok / Status</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredFurnitures.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-4 flex items-center gap-3">
                          {item.image_url ? (
                            <img src={item.image_url} className="w-12 h-12 object-cover rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.material}</div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">{item.category}</td>
                        <td className="p-4 text-xs text-slate-500">
                          <div>Dimensi: {item.dimensions || '-'}</div>
                          <div>Finishing: {item.finishing || '-'}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                        <td className="p-4">
                          {item.is_po ? (
                            <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">Pre-Order</span>
                          ) : (
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              Stok: {item.stock}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: LOGIN / REGISTER FORM */}
      {viewMode === 'login' && (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl border shadow-md w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center">{isRegister ? 'Daftar Toko SaaS Baru' : 'Login Admin Toko'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegister && (
                <>
                  <input type="text" placeholder="Nama Toko/Vendor" className="w-full border p-2.5 rounded-xl text-sm" value={authData.storeName} onChange={e => setAuthData({...authData, storeName: e.target.value})} required />
                  <input type="text" placeholder="Nama Admin" className="w-full border p-2.5 rounded-xl text-sm" value={authData.adminName} onChange={e => setAuthData({...authData, adminName: e.target.value})} required />
                </>
              )}
              <input type="email" placeholder="Email" className="w-full border p-2.5 rounded-xl text-sm" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
              <input type="password" placeholder="Password" className="w-full border p-2.5 rounded-xl text-sm" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} required />
              
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">
                {isRegister ? 'Daftarkan Toko' : 'Masuk Dashboard'}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-600">
              <button onClick={() => setIsRegister(!isRegister)} className="text-amber-600 font-semibold underline">
                {isRegister ? 'Kembali ke Login' : 'Daftar Toko Baru'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PRODUK E-COMMERCE */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 overflow-hidden shadow-2xl relative">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-20 h-20 text-slate-300 m-auto" />
                )}
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase">{selectedProduct.category}</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1 mb-2">{selectedProduct.name}</h3>
                  <div className="text-2xl font-extrabold text-slate-900 mb-4">
                    Rp {Number(selectedProduct.price).toLocaleString('id-ID')}
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 border-t pt-4">
                    <p><span className="font-semibold text-slate-800">Bahan Material:</span> {selectedProduct.material || '-'}</p>
                    <p><span className="font-semibold text-slate-800">Jenis Finishing:</span> {selectedProduct.finishing || '-'}</p>
                    <p><span className="font-semibold text-slate-800">Dimensi Produk:</span> {selectedProduct.dimensions || '-'}</p>
                    <p><span className="font-semibold text-slate-800">Estimasi Berat:</span> {selectedProduct.weight_kg || '0'} kg</p>
                  </div>
                </div>

                <div className="pt-6">
                  <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setViewMode('cart'); }} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Beli Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH/EDIT PRODUK (ADMIN) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editId ? 'Edit Furniture' : 'Tambah Furniture Baru'}</h3>
            <form onSubmit={handleSaveFurniture} className="space-y-3 text-sm">
              <input type="text" placeholder="Nama Furniture" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-2">
                <select className="border p-2 rounded" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Kursi">Kursi</option>
                  <option value="Meja">Meja</option>
                  <option value="Lemari">Lemari</option>
                  <option value="Sofa">Sofa</option>
                  <option value="Tempat Tidur">Tempat Tidur</option>
                </select>
                <input type="number" placeholder="Harga (IDR)" className="border p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Stok" className="border p-2 rounded" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                <label className="flex items-center gap-2 border p-2 rounded cursor-pointer">
                  <input type="checkbox" checked={formData.is_po} onChange={e => setFormData({...formData, is_po: e.target.checked})} />
                  <span>Sistem Pre-Order</span>
                </label>
              </div>

              <input type="text" placeholder="Dimensi (misal: 120x80x75 cm)" className="w-full border p-2 rounded" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Bahan Material" className="border p-2 rounded" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
                <input type="text" placeholder="Finishing" className="border p-2 rounded" value={formData.finishing} onChange={e => setFormData({...formData, finishing: e.target.value})} />
              </div>

              <input type="number" placeholder="Berat (kg)" className="w-full border p-2 rounded" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} />
              <input type="text" placeholder="URL Gambar Produk" className="w-full border p-2 rounded" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />

              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-slate-600">Batal</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}