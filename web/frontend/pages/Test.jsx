import React, { useState, useRef, useEffect } from 'react';
import './Test.css'; // Yeh file neeche CSS hai

const Test = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    order_id: '',
    product: '',
    base_price: '',
    quantity: '',
    condition: '',
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [productById, setProductById] = useState(null);
  const fileInputRef = useRef(null);


  console.log(products, "<<<< products")
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const fetchProducts = async () => {
    try {
      const shopDomain = new URLSearchParams(window.location.search).get("shop");

      const res = await fetch(`/api/products`);

      const products = await res.json();
      setProducts(products);

    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    fetchProducts()
  }, [])


  const fetchProductById = async (id) => {
    try {
      const res = await fetch(`/api/getProductById/${id}`);
      const product = await res.json();
      setProductById(product);
    } catch (error) {
      console.log(error, "<<< error")
    }
  }


  useEffect(() => {
    fetchProductById("8310040002660")
  }, [])

  console.log(productById, " <<<<< productById")


  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Check total files limit
    if (files.length + selectedFiles.length > 8) {
      setErrors(prev => ({ ...prev, images: 'Maximum 8 images allowed' }));
      return;
    }

    // Filter images only
    const imageFiles = selectedFiles.filter(file =>
      file.type.startsWith('image/')
    );

    // Create previews
    const newPreviews = [];
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          id: Date.now() + Math.random(),
          url: reader.result,
          file
        });
        if (newPreviews.length === imageFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setFiles(prev => [...prev, ...imageFiles]);
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!formData.product.trim()) newErrors.product = 'Product name is required';
    if (!formData.base_price) newErrors.base_price = 'Base price is required';
    if (!formData.condition) newErrors.condition = 'Please select condition';
    if (files.length < 1) newErrors.images = 'Please upload at least 1 image';
    if (files.length > 8) newErrors.images = 'Maximum 8 images allowed';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage('Please fix the errors above');
      return;
    }

    const formDataToSend = new FormData();

    // Append text fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value) formDataToSend.append(key, value);
    });

    // Append all files
    files.forEach(file => {
      formDataToSend.append('images', file);
    });

    console.log('Form Data to Send:');
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value instanceof File ? value.name : value);
    }

    try {
      setMessage('Submitting...');
      const response = await fetch('/api/payback-form', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'same-origin' // Shopify ke liye zaroori hai
      });

      if (response.ok) {
        setMessage('Request submitted successfully!');
        // Reset form
        setFormData({
          name: '',
          email: '',
          order_id: '',
          product: '',
          base_price: '',
          quantity: '',
          condition: '',
          notes: '',
        });
        setFiles([]);
        setPreviews([]);
        setTimeout(() => {
          setShowModal(false);
          setMessage('');
        }, 2000);
      } else {
        const errorText = await response.text();
        setMessage(`Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage(`Error: ${error.message}`);
    }
  };

  // Test function for simple API call
  const testApi = async () => {
    try {
      const response = await fetch('/apps/secondloop/payback-form', {
        method: 'POST',
        body: JSON.stringify({ test: 'test data' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Test response:', response);
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  return (
    <div className="test-container">
      <h1>Second Loop Test Page</h1>

      <div className="test-actions">
        <button onClick={() => testApi()} className="test-btn">
          Test Simple API Call
        </button>

        <button onClick={() => setShowModal(true)} className="open-form-btn">
          Open Payback Form
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="sl-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
            <header className="sl-modal-header">
              <h3>Payback / Trade-in Form</h3>
              <button className="sl-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </header>

            <main className="sl-modal-body">
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {errors.name && <div className="error">{errors.name}</div>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="error">{errors.email}</div>}
                </div>

                {/* Order ID */}
                <div className="form-group">
                  <label htmlFor="order_id">Order ID (optional)</label>
                  <input
                    type="text"
                    id="order_id"
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleChange}
                  />
                </div>

                {/* Product */}
                <div className="form-group">
                  <label htmlFor="product">Product Name *</label>
                  <input
                    type="text"
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    required
                  />
                  {errors.product && <div className="error">{errors.product}</div>}
                </div>

                {/* Base Price */}
                <div className="form-group">
                  <label htmlFor="base_price">Base Price *</label>
                  <input
                    type="number"
                    id="base_price"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                  {errors.base_price && <div className="error">{errors.base_price}</div>}
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label htmlFor="quantity">Quantity (optional)</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                  />
                </div>

                {/* Condition */}
                <div className="form-group">
                  <label htmlFor="condition">Condition *</label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- select --</option>
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                  {errors.condition && <div className="error">{errors.condition}</div>}
                </div>

                {/* Images */}
                <div className="form-group">
                  <label htmlFor="images">Images (1-8) *</label>
                  <input
                    type="file"
                    id="images"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                  />
                  <small>You can upload up to 8 images (jpg, png)</small>
                  {errors.images && <div className="error">{errors.images}</div>}

                  {/* Image Previews */}
                  <div className="image-previews">
                    {previews.map((preview, index) => (
                      <div key={preview.id} className="image-preview">
                        <img src={preview.url} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="remove-image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label htmlFor="notes">Notes / Description (optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>

                {/* Message */}
                {message && (
                  <div className={`form-message ${message.includes('Error') ? 'error' : 'success'}`}>
                    {message}
                  </div>
                )}
              </form>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;