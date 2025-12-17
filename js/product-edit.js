// product-edit.js - Quản lý chế độ chỉnh sửa và crop editor

let isEditMode = false;
let currentEditingProduct = null;
let cropEditor = null;

// Trong crop editor, thêm hàm load default quality
function loadDefaultQualityToEditor() {
    const defaultQuality = localStorage.getItem('defaultImageQuality') || 'high';
    
    // Chọn radio button tương ứng
    const radioButton = document.getElementById(`quality_${defaultQuality}`);
    if (radioButton) {
        radioButton.checked = true;
        console.log(`⚙️ Đã chọn chất lượng mặc định: ${defaultQuality}`);
    }
}

// Gọi hàm này khi mở crop editor
function editProductImage(productId) {
    currentEditingProduct = productId;
    
    if (!document.getElementById('cropEditor')) {
        createCropEditor();
    }
    
    showCropEditor();
    loadDefaultQualityToEditor(); // THÊM DÒNG NÀY
    loadCurrentProductImage();
}

/**
 * Thêm nút edit vào header
 */
function addEditButtonToHeader() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    // Kiểm tra xem đã có nút chưa
    if (document.getElementById('btnEditMode')) return;
    
    const editButton = document.createElement('button');
    editButton.id = 'btnEditMode';
    editButton.className = 'btn-edit-mode';
    editButton.title = 'Sửa hàng hóa';
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    
    // Chèn vào trước cart badge
    const cartBadge = headerRight.querySelector('.cart-badge');
    if (cartBadge) {
        headerRight.insertBefore(editButton, cartBadge);
    } else {
        headerRight.appendChild(editButton);
    }
}

/**
 * Bật/tắt chế độ chỉnh sửa
 */
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editButton = document.getElementById('btnEditMode');
    
    if (isEditMode) {
        // Bật chế độ chỉnh sửa
        editButton.classList.add('active');
        editButton.title = 'Kết thúc chỉnh sửa';
        editButton.innerHTML = '<i class="fas fa-check"></i>';
        
        // Hiển thị UI chỉnh sửa
        showEditModeUI();
        
        // Thông báo
        Utils.showToast('Đã bật chế độ chỉnh sửa', 'info');
        
    } else {
        // Tắt chế độ chỉnh sửa
        editButton.classList.remove('active');
        editButton.title = 'Sửa hàng hóa';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        
        // Ẩn UI chỉnh sửa
        hideEditModeUI();
        
        // Đóng crop editor nếu đang mở
        if (cropEditor) {
            closeCropEditor();
        }
        
        // Thông báo
        Utils.showToast('Đã tắt chế độ chỉnh sửa', 'info');
    }
}

/**
 * Hiển thị UI chế độ chỉnh sửa (FIXED VERSION)
 */
function showEditModeUI() {
    console.log('🔄 Đang bật chế độ chỉnh sửa...');
    // 1. Thêm badge chỉnh sửa
const editBadge = document.createElement('div');
editBadge.className = 'edit-badge';
editBadge.textContent = 'Sửa';
editBadge.style.cssText = `
    position: absolute;
    top: 6px;
    right: 6px; /* CHUYỂN SANG PHẢI */
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 10;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;
    const productCards = document.querySelectorAll('.product-card');
    console.log(`📊 Tìm thấy ${productCards.length} thẻ sản phẩm`);
    
    if (productCards.length === 0) {
        console.error('❌ Không tìm thấy thẻ sản phẩm nào!');
        return;
    }
    
    productCards.forEach((card, index) => {
        const productId = card.getAttribute('data-product-id');
        if (!productId) {
            console.warn(`⚠️ Thẻ ${index} không có data-product-id`);
            return;
        }
        
        console.log(`🎯 Xử lý thẻ sản phẩm ${productId}`);
        
        // Kiểm tra đã có badge chưa
        if (card.querySelector('.edit-badge')) {
            console.log(`ℹ️ Thẻ ${productId} đã có badge, bỏ qua`);
            return;
        }
        
        // 1. Thêm badge chỉnh sửa
        const editBadge = document.createElement('div');
        editBadge.className = 'edit-badge';
        editBadge.textContent = 'Sửa';
        editBadge.style.cssText = `
            position: absolute;
            top: 6px;
            left: 6px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            z-index: 10;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        // 2. Thêm controls chỉnh sửa
        const editControls = document.createElement('div');
        editControls.className = 'edit-controls';
        editControls.style.cssText = `
            position: absolute;
            bottom: 8px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 8px;
            padding: 0 6px;
            z-index: 10;
            opacity: 1 !important;
            visibility: visible !important;
        `;
        
        editControls.innerHTML = `
            <button class="btn-edit-info" onclick="editProductInfo('${productId}')" 
                    title="Sửa thông tin"
                    style="
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        border: none;
                        background: linear-gradient(135deg, #4a6ee0 0%, #3a5ecf 100%);
                        color: white;
                        font-size: 14px;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-edit-image" onclick="editProductImage('${productId}')" 
                    title="Sửa ảnh"
                    style="
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        border: none;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        font-size: 14px;
                        cursor: pointer;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                <i class="fas fa-image"></i>
            </button>
        `;
        
        // 3. Thêm vào card
        card.classList.add('edit-mode');
        card.style.border = '2px solid #f59e0b';
        card.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.15)';
        
        card.appendChild(editBadge);
        card.appendChild(editControls);
        
        console.log(`✅ Đã thêm controls cho ${productId}`);
    });
    
    console.log('✅ Đã bật chế độ chỉnh sửa');
}

/**
 * Ẩn UI chế độ chỉnh sửa
 */
function hideEditModeUI() {
    // Xóa badge và controls
    document.querySelectorAll('.edit-badge').forEach(badge => {
        badge.remove();
    });
    
    document.querySelectorAll('.edit-controls').forEach(controls => {
        controls.remove();
    });
    
    // Xóa class edit-mode
    document.querySelectorAll('.product-card.edit-mode').forEach(card => {
        card.classList.remove('edit-mode');
    });
    
    // Kích hoạt lại click
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.pointerEvents = 'auto';
    });
    
    // Kích hoạt lại category filter
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    });
}

/**
 * Thiết lập event listeners cho edit mode
 */
function setupEditModeListeners() {
    // Nút toggle edit mode
    document.addEventListener('click', (e) => {
        if (e.target.closest('#btnEditMode')) {
            toggleEditMode();
        }
    });
    
    // Escape để thoát edit mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isEditMode) {
            toggleEditMode();
        }
    });
}

// ========== PRODUCT EDIT FUNCTIONS ==========

/**
 * Mở modal chỉnh sửa thông tin sản phẩm
 * @param {string} productId - ID sản phẩm
 */
function editProductInfo(productId) {
    currentEditingProduct = productId;
    
    // Sử dụng modal có sẵn trong hệ thống
    const product = products.find(p => p.id === productId);
    if (!product) {
        Utils.showToast('Không tìm thấy sản phẩm', 'error');
        return;
    }
    
    // Điền thông tin vào modal
    document.getElementById('hkdProductCode').value = product.msp || '';
    document.getElementById('hkdProductName').value = product.name || '';
    document.getElementById('hkdProductUnit').value = product.unit || 'cái';
    document.getElementById('hkdProductPrice').value = product.price || 0;
    document.getElementById('hkdProductStock').value = product.stock || 0;
    document.getElementById('hkdProductDescription').value = product.description || '';
    
    // Điền category
    const categorySelect = document.getElementById('hkdProductCategory');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Chọn danh mục...</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (category.id === product.categoryId) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    }
    
    // Đánh dấu đang edit
    document.getElementById('hkdProductModal').dataset.editId = productId;
    document.querySelector('#hkdProductModal .modal-title').textContent = 'Sửa hàng hóa';
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('hkdProductModal'));
    modal.show();
}

/**
 * Mở crop editor để chỉnh sửa ảnh
 * @param {string} productId - ID sản phẩm
 */
function editProductImage(productId) {
    currentEditingProduct = productId;
    
    // Tạo crop editor nếu chưa có
    if (!document.getElementById('cropEditor')) {
        createCropEditor();
    }
    
    // Hiển thị crop editor
    showCropEditor();
    
    // Load ảnh hiện tại nếu có
    loadCurrentProductImage();
}

// ========== CROP EDITOR FUNCTIONS ==========

/**
 * Tạo crop editor DOM
 */
function createCropEditor() {
    const cropEditorHTML = `
        <div class="crop-editor-overlay" id="cropEditorOverlay">
            <div class="crop-editor" id="cropEditor">
                <div class="crop-editor-header">
                    <h3><i class="fas fa-crop-alt"></i> Chỉnh sửa ảnh sản phẩm</h3>
                    <button class="close-crop-editor" id="closeCropEditor">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="crop-editor-body">
    <!-- Preview area với tỷ lệ cố định -->
    <div class="image-preview-container" id="previewContainer">
        <div class="crop-container">
            <canvas id="cropCanvas"></canvas>
            <div class="crop-overlay" id="cropOverlay">
                <div class="crop-area" id="cropArea">
                    <div class="crop-handle nw"></div>
                    <div class="crop-handle ne"></div>
                    <div class="crop-handle sw"></div>
                    <div class="crop-handle se"></div>
                    <div class="crop-handle n"></div>
                    <div class="crop-handle s"></div>
                    <div class="crop-handle w"></div>
                    <div class="crop-handle e"></div>
                </div>
            </div>
            <div class="crop-loading" id="cropLoading" style="display: none;">
                <div class="loading-spinner"></div>
            </div>
        </div>
        <div class="crop-instruction">Kéo để di chuyển ảnh • Tỉ lệ đã cố định theo hiển thị sản phẩm</div>
    </div>
    
    <!-- Preview thumbnail với tỷ lệ giống -->
    <div class="preview-thumbnail" id="previewThumbnail">
        <div class="placeholder">
            <i class="fas fa-image"></i>
        </div>
    </div>
                    
                    <!-- Crop controls -->
                    <div class="crop-controls">
                        <button class="crop-control-btn" onclick="rotateCrop(-90)">
                            <i class="fas fa-undo"></i> Xoay trái
                        </button>
                        <button class="crop-control-btn" onclick="rotateCrop(90)">
                            <i class="fas fa-redo"></i> Xoay phải
                        </button>
                        <button class="crop-control-btn" onclick="centerCrop()">
                            <i class="fas fa-crosshairs"></i> Căn giữa
                        </button>
                        <button class="crop-control-btn" onclick="resetCrop()">
                            <i class="fas fa-sync"></i> Reset
                        </button>
                    </div>
                    
                    <!-- Error message -->
                    <div class="crop-error" id="cropError" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i>
                        <span id="cropErrorMessage"></span>
                    </div>
                    
                    <!-- Image source tabs -->
                    <div class="image-source-tabs">
                        <button class="image-source-tab active" data-source="upload">
                            <i class="fas fa-upload"></i> Tải lên
                        </button>
                        <button class="image-source-tab" data-source="camera">
                            <i class="fas fa-camera"></i> Chụp ảnh
                        </button>
                        <button class="image-source-tab" data-source="url">
                            <i class="fas fa-link"></i> Link ảnh
                        </button>
                    </div>
                    
                    <!-- Image source content -->
                    <div class="image-source-content">
                        <!-- Upload panel -->
                        <div class="image-source-panel active" id="uploadPanel">
                            <div class="upload-area" id="uploadArea">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Kéo thả ảnh vào đây</p>
                                <p>hoặc</p>
                                <button class="btn btn-primary" onclick="document.getElementById('imageFile').click()">
                                    Chọn file từ máy
                                </button>
                                <small>Hỗ trợ JPG, PNG, WebP (tối đa 5MB)</small>
                            </div>
                            <input type="file" id="imageFile" accept="image/*" style="display: none;">
                        </div>
                        
                        <!-- Camera panel -->
                        <div class="image-source-panel" id="cameraPanel">
                            <div class="camera-preview" id="cameraPreview">
                                <video id="cameraVideo" autoplay playsinline></video>
                            </div>
                            <div class="camera-controls">
                                <button class="camera-btn btn-capture" id="btnCapture">
                                    <i class="fas fa-camera"></i> Chụp ảnh
                                </button>
                                <button class="camera-btn btn-cancel-camera" id="btnCancelCamera">
                                    <i class="fas fa-times"></i> Hủy
                                </button>
                            </div>
                        </div>
                        
                        <!-- URL panel -->
                        <div class="image-source-panel" id="urlPanel">
                            <div class="url-input-group">
                                <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg">
                                <button class="btn-load-url" id="btnLoadUrl">
                                    <i class="fas fa-download"></i> Tải ảnh
                                </button>
                            </div>
                        </div>
                        <div class="quality-settings">
        <h6><i class="fas fa-cog"></i> Cài đặt chất lượng</h6>
        
        <div class="quality-option">
            <input type="radio" id="quality_low" name="quality" value="low" checked>
            <label for="quality_low">
                <span class="quality-label">Nhẹ</span>
                <span class="quality-desc">120×72px • ~20KB • Nhanh</span>
            </label>
        </div>
        
        <div class="quality-option">
            <input type="radio" id="quality_medium" name="quality" value="medium">
            <label for="quality_medium">
                <span class="quality-label">Trung bình</span>
                <span class="quality-desc">180×108px • ~35KB • Cân bằng</span>
            </label>
        </div>
        
        <div class="quality-option">
            <input type="radio" id="quality_high" name="quality" value="high">
            <label for="quality_high">
                <span class="quality-label">Cao</span>
                <span class="quality-desc">240×144px • ~50KB • Nét</span>
            </label>
        </div>
        
        <div class="quality-option">
            <input type="radio" id="quality_original" name="quality" value="original">
            <label for="quality_original">
                <span class="quality-label">Gốc (giữ tỷ lệ)</span>
                <span class="quality-desc">Giữ kích thước gốc • Chất lượng cao</span>
            </label>
        </div>
        
        <div class="quality-info" id="qualityInfo">
            <small><i class="fas fa-info-circle"></i> Chọn "Cao" để ảnh hiển thị nét nhất</small>
        </div>

                    </div>
                </div>
                
                <div class="crop-editor-actions">
                    <button class="btn-cancel-crop" id="btnCancelCrop">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                    <button class="btn-save-crop" id="btnSaveCrop">
                        <i class="fas fa-save"></i> Lưu ảnh
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Thêm vào body
    document.body.insertAdjacentHTML('beforeend', cropEditorHTML);
    
    // Khởi tạo crop editor
    initCropEditor();
}

/**
 * Khởi tạo crop editor
 */
function initCropEditor() {
    cropEditor = {
        canvas: document.getElementById('cropCanvas'),
        ctx: null,
        image: null,
        cropArea: document.getElementById('cropArea'),
        isDragging: false,
        dragType: null,
        cropData: {
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            scale: 1
        },
        originalImageData: null,
        currentRotation: 0
    };
    
    if (cropEditor.canvas) {
        cropEditor.ctx = cropEditor.canvas.getContext('2d');
    }
    
    // Thiết lập event listeners
    setupCropEditorListeners();
    setupImageSourceTabs();
}

/**
 * Hiển thị crop editor
 */
function showCropEditor() {
    const overlay = document.getElementById('cropEditorOverlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Ngăn scroll
    }
}

/**
 * Đóng crop editor
 */
function closeCropEditor() {
    const overlay = document.getElementById('cropEditorOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Khôi phục scroll
        
        // Dừng camera nếu đang chạy
        stopCamera();
        
        // Reset crop editor
        resetCropEditor();
    }
}

/**
 * Reset crop editor
 */
function resetCropEditor() {
    if (cropEditor) {
        cropEditor.image = null;
        cropEditor.originalImageData = null;
        cropEditor.currentRotation = 0;
        cropEditor.cropData = {
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            scale: 1
        };
        
        // Xóa canvas
        if (cropEditor.ctx) {
            cropEditor.ctx.clearRect(0, 0, cropEditor.canvas.width, cropEditor.canvas.height);
        }
        
        // Xóa preview
        const previewThumbnail = document.getElementById('previewThumbnail');
        if (previewThumbnail) {
            previewThumbnail.innerHTML = '<div class="placeholder"><i class="fas fa-image"></i></div>';
        }
        
        // Ẩn error
        hideCropError();
        
        // Reset về tab upload
        switchImageSourceTab('upload');
    }
}

/**
 * Thiết lập event listeners cho crop editor
 */
function setupCropEditorListeners() {
    // Close button
    document.getElementById('closeCropEditor')?.addEventListener('click', closeCropEditor);
    document.getElementById('btnCancelCrop')?.addEventListener('click', closeCropEditor);
    
    // Overlay click để đóng
    document.getElementById('cropEditorOverlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'cropEditorOverlay') {
            closeCropEditor();
        }
    });
    
    // Save button
    document.getElementById('btnSaveCrop')?.addEventListener('click', saveCroppedImage);
    
    // File upload
    const imageFile = document.getElementById('imageFile');
    if (imageFile) {
        imageFile.addEventListener('change', handleFileUpload);
    }
    
    // Drag and drop
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImageFile(files[0]);
            }
        });
        
        // Click to upload
        uploadArea.addEventListener('click', () => {
            imageFile.click();
        });
    }
    
    // Camera capture
    document.getElementById('btnCapture')?.addEventListener('click', captureFromCamera);
    document.getElementById('btnCancelCamera')?.addEventListener('click', stopCamera);
    
    // URL load
    document.getElementById('btnLoadUrl')?.addEventListener('click', loadImageFromUrl);
    
    // Enter key for URL input
    document.getElementById('imageUrl')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadImageFromUrl();
        }
    });
    
    // Crop area interaction
    setupCropAreaInteraction();
}

/**
 * Thiết lập tương tác với vùng crop
 */
/**
 * Thiết lập tương tác với vùng crop (CHỈ CHO PHÉP MOVE)
 */
function setupCropAreaInteraction() {
    if (!cropEditor || !cropEditor.cropArea) return;
    
    let startX, startY, startOffsetX, startOffsetY;
    
    // Mouse events - CHỈ CHO PHÉP DI CHUYỂN ẢNH
    cropEditor.canvas.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events
    cropEditor.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startDrag({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    });
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        drag({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    });
    
    document.addEventListener('touchend', stopDrag);
    
    function startDrag(e) {
        if (!cropEditor.image) return;
        
        cropEditor.isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startOffsetX = cropEditor.cropData.offsetX;
        startOffsetY = cropEditor.cropData.offsetY;
        
        e.preventDefault();
    }
    
    function drag(e) {
        if (!cropEditor.isDragging || !cropEditor.image) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        // Giới hạn di chuyển để ảnh luôn cover container
        const maxOffsetX = Math.max(0, (cropEditor.cropData.scale * cropEditor.cropData.imageWidth - cropEditor.canvas.width) / 2);
        const maxOffsetY = Math.max(0, (cropEditor.cropData.scale * cropEditor.cropData.imageHeight - cropEditor.canvas.height) / 2);
        
        let newOffsetX = startOffsetX + dx;
        let newOffsetY = startOffsetY + dy;
        
        // Giới hạn offset
        newOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX));
        newOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY));
        
        // Cập nhật offset
        cropEditor.cropData.offsetX = newOffsetX;
        cropEditor.cropData.offsetY = newOffsetY;
        
        // Vẽ lại ảnh với offset mới
        redrawImageWithOffset();
        updatePreview();
        
        e.preventDefault();
    }
    
    function stopDrag() {
        cropEditor.isDragging = false;
    }
}

/**
 * Vẽ lại ảnh với offset hiện tại
 */
function redrawImageWithOffset() {
    if (!cropEditor.image || !cropEditor.ctx) return;
    
    const { offsetX, offsetY, scale, imageWidth, imageHeight } = cropEditor.cropData;
    const canvas = cropEditor.canvas;
    
    // Xóa canvas
    cropEditor.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ ảnh với offset
    cropEditor.ctx.drawImage(
        cropEditor.image,
        0, 0, imageWidth, imageHeight,
        offsetX, offsetY, imageWidth * scale, imageHeight * scale
    );
}

/**
 * Cập nhật vùng crop trên UI (luôn full container)
 */
function updateCropArea() {
    if (!cropEditor || !cropEditor.cropArea) return;
    
    const cropArea = cropEditor.cropArea;
    cropArea.style.left = '0px';
    cropArea.style.top = '0px';
    cropArea.style.width = '100%';
    cropArea.style.height = '100%';
}

/**
 * Thiết lập image source tabs
 */
function setupImageSourceTabs() {
    const tabs = document.querySelectorAll('.image-source-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const source = tab.getAttribute('data-source');
            switchImageSourceTab(source);
        });
    });
}

/**
 * Chuyển đổi giữa các tab nguồn ảnh
 * @param {string} source - upload, camera, url
 */
function switchImageSourceTab(source) {
    // Update active tab
    document.querySelectorAll('.image-source-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-source') === source) {
            tab.classList.add('active');
        }
    });
    
    // Update active panel
    document.querySelectorAll('.image-source-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const activePanel = document.getElementById(`${source}Panel`);
    if (activePanel) {
        activePanel.classList.add('active');
    }
    
    // Start camera if switching to camera tab
    if (source === 'camera') {
        startCamera();
    } else {
        stopCamera();
    }
}

// ========== IMAGE PROCESSING FUNCTIONS ==========

/**
 * Xử lý upload file
 */
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
}

/**
 * Xử lý file ảnh
 * @param {File} file - File ảnh
 */
async function handleImageFile(file) {
    try {
        // Kiểm tra file
        if (!file.type.startsWith('image/')) {
            showCropError('Vui lòng chọn file ảnh (JPG, PNG, WebP)');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showCropError('Kích thước file quá lớn (tối đa 5MB)');
            return;
        }
        
        showCropLoading();
        
        // Đọc file
        const reader = new FileReader();
        reader.onload = (e) => {
            loadImageToCropEditor(e.target.result, 'upload', file.name);
        };
        reader.onerror = () => {
            hideCropLoading();
            showCropError('Lỗi đọc file ảnh');
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        hideCropLoading();
        showCropError('Lỗi xử lý file: ' + error.message);
    }
}

/**
 * Bật camera
 */
async function startCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showCropError('Trình duyệt không hỗ trợ camera');
            return;
        }
        
        const video = document.getElementById('cameraVideo');
        if (!video) return;
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Ưu tiên camera sau
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        video.srcObject = stream;
        
    } catch (error) {
        showCropError('Không thể truy cập camera: ' + error.message);
    }
}

/**
 * Dừng camera
 */
function stopCamera() {
    const video = document.getElementById('cameraVideo');
    if (video && video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}

/**
 * Chụp ảnh từ camera
 */
function captureFromCamera() {
    const video = document.getElementById('cameraVideo');
    if (!video) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    loadImageToCropEditor(imageData, 'camera');
    
    // Dừng camera sau khi chụp
    stopCamera();
    
    // Chuyển về tab upload
    switchImageSourceTab('upload');
}

/**
 * Tải ảnh từ URL
 */
async function loadImageFromUrl() {
    const urlInput = document.getElementById('imageUrl');
    if (!urlInput) return;
    
    const url = urlInput.value.trim();
    if (!url) {
        showCropError('Vui lòng nhập URL ảnh');
        return;
    }
    
    try {
        showCropLoading();
        
        // Sử dụng hàm từ image-utils.js
        if (typeof window.loadImageFromUrl === 'function') {
            const imageData = await window.loadImageFromUrl(url);
            loadImageToCropEditor(imageData, 'url', url);
        } else {
            // Fallback nếu không có image-utils
            const response = await fetch(url);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = (e) => {
                loadImageToCropEditor(e.target.result, 'url', url);
            };
            reader.readAsDataURL(blob);
        }
        
    } catch (error) {
        hideCropLoading();
        showCropError('Không thể tải ảnh từ URL: ' + error.message);
    }
}

/**
 * Load ảnh hiện tại của sản phẩm
 */
async function loadCurrentProductImage() {
    if (!currentEditingProduct) return;
    
    try {
        const imageData = await getProductImage(currentEditingProduct);
        if (imageData && imageData.originalData) {
            // Có ảnh gốc, load để chỉnh sửa tiếp
            loadImageToCropEditor(imageData.originalData, 'existing');
        } else if (imageData && imageData.imageData) {
            // Chỉ có ảnh đã nén, load để chỉnh sửa
            loadImageToCropEditor(imageData.imageData, 'existing');
        }
        // Nếu không có ảnh, giữ nguyên để người dùng upload mới
    } catch (error) {
        console.error('❌ Lỗi load ảnh hiện tại:', error);
    }
}

/**
 * Load ảnh vào crop editor
 * @param {string} imageData - Base64 image data
 * @param {string} source - Nguồn ảnh
 * @param {string} sourceName - Tên nguồn
 */
/**
 * Load ảnh vào crop editor với tỷ lệ cố định
 * @param {string} imageData - Base64 image data
 * @param {string} source - Nguồn ảnh
 * @param {string} sourceName - Tên nguồn
 */
function loadImageToCropEditor(imageData, source, sourceName = '') {
    showCropLoading();
    
    const img = new Image();
    img.onload = () => {
        try {
            // Lưu ảnh gốc
            cropEditor.originalImageData = imageData;
            cropEditor.image = img;
            cropEditor.currentRotation = 0;
            
            // Lấy kích thước container crop (tỷ lệ 100% x 60%)
            const container = document.querySelector('.crop-container');
            if (!container) {
                throw new Error('Không tìm thấy crop container');
            }
            
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            console.log('📐 Container size:', containerWidth, 'x', containerHeight);
            console.log('📐 Image size:', img.width, 'x', img.height);
            
            // Cập nhật canvas với kích thước container
            cropEditor.canvas.width = containerWidth;
            cropEditor.canvas.height = containerHeight;
            
            // Tính toán scale để ảnh cover toàn bộ container
            const scaleX = containerWidth / img.width;
            const scaleY = containerHeight / img.height;
            const scale = Math.max(scaleX, scaleY); // Scale lớn hơn để cover
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // Tính vị trí để căn giữa
            const offsetX = (containerWidth - scaledWidth) / 2;
            const offsetY = (containerHeight - scaledHeight) / 2;
            
            // Vẽ ảnh đã scale
            cropEditor.ctx.clearRect(0, 0, containerWidth, containerHeight);
            cropEditor.ctx.drawImage(
                img, 
                0, 0, img.width, img.height,
                offsetX, offsetY, scaledWidth, scaledHeight
            );
            
            // Thiết lập crop data CHIẾM TOÀN BỘ CONTAINER
            cropEditor.cropData = {
                x: 0,
                y: 0,
                width: containerWidth,
                height: containerHeight,
                offsetX: offsetX,
                offsetY: offsetY,
                scale: scale,
                imageWidth: img.width,
                imageHeight: img.height
            };
            
            // Cập nhật UI
            updateCropArea();
            updatePreview();
            
            hideCropLoading();
            
            console.log('✅ Ảnh đã load với tỷ lệ container');
            
        } catch (error) {
            hideCropLoading();
            showCropError('Lỗi xử lý ảnh: ' + error.message);
        }
    };
    
    img.onerror = () => {
        hideCropLoading();
        showCropError('Không thể tải ảnh');
    };
    
    img.src = imageData;
}

// ========== CROP OPERATIONS ==========

/**
 * Xoay ảnh
 * @param {number} degrees - Góc xoay
 */
function rotateCrop(degrees) {
    if (!cropEditor.image || !cropEditor.originalImageData) return;
    
    cropEditor.currentRotation += degrees;
    
    // Load lại ảnh với rotation mới
    const img = new Image();
    img.onload = () => {
        // Cập nhật lại canvas với ảnh đã xoay
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (degrees === 90 || degrees === -90 || degrees === 270 || degrees === -270) {
            // Swap width/height for 90 degree rotations
            canvas.width = cropEditor.canvas.height;
            canvas.height = cropEditor.canvas.width;
        } else {
            canvas.width = cropEditor.canvas.width;
            canvas.height = cropEditor.canvas.height;
        }
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(degrees * Math.PI / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        // Cập nhật crop editor
        cropEditor.canvas.width = canvas.width;
        cropEditor.canvas.height = canvas.height;
        cropEditor.ctx.clearRect(0, 0, canvas.width, canvas.height);
        cropEditor.ctx.drawImage(canvas, 0, 0);
        
        // Reset crop area
        const cropSize = Math.min(canvas.width, canvas.height) * 0.7;
        cropEditor.cropData = {
            x: (canvas.width - cropSize) / 2,
            y: (canvas.height - cropSize) / 2,
            width: cropSize,
            height: cropSize,
            scale: 1
        };
        
        updateCropArea();
        updatePreview();
    };
    
    img.src = cropEditor.originalImageData;
}

/**
 * Căn giữa vùng crop
 */
function centerCrop() {
    if (!cropEditor.image) return;
    
    cropEditor.cropData.x = (cropEditor.canvas.width - cropEditor.cropData.width) / 2;
    cropEditor.cropData.y = (cropEditor.canvas.height - cropEditor.cropData.height) / 2;
    
    updateCropArea();
    updatePreview();
}

/**
 * Reset về ban đầu
 */
function resetCrop() {
    if (!cropEditor.image || !cropEditor.originalImageData) return;
    
    loadImageToCropEditor(cropEditor.originalImageData, 'reset');
}

/**
 * Cập nhật preview thumbnail
 */
function updatePreview() {
    if (!cropEditor || !cropEditor.image) return;
    
    try {
        // Tạo canvas preview với tỷ lệ 100% x 60%
        const previewContainer = document.getElementById('previewThumbnail');
        if (!previewContainer) return;
        
        // Tính toán crop từ ảnh gốc
        const { offsetX, offsetY, scale, imageWidth, imageHeight } = cropEditor.cropData;
        const containerWidth = cropEditor.canvas.width;
        const containerHeight = cropEditor.canvas.height;
        
        // Tính phần ảnh được hiển thị trong container
        const visibleImageX = -offsetX / scale;
        const visibleImageY = -offsetY / scale;
        const visibleImageWidth = containerWidth / scale;
        const visibleImageHeight = containerHeight / scale;
        
        // Tạo canvas để crop phần hiển thị
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = containerWidth;
        cropCanvas.height = containerHeight;
        const cropCtx = cropCanvas.getContext('2d');
        
        // Vẽ phần ảnh được hiển thị
        cropCtx.drawImage(
            cropEditor.image,
            visibleImageX, visibleImageY, visibleImageWidth, visibleImageHeight,
            0, 0, containerWidth, containerHeight
        );
        
        // Tạo canvas preview cuối cùng (120x72 - giữ tỷ lệ 100:60)
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 120;
        previewCanvas.height = 72; // 120 * 0.6
        const previewCtx = previewCanvas.getContext('2d');
        
        // Scale từ cropCanvas xuống preview size
        previewCtx.drawImage(cropCanvas, 0, 0, 120, 72);
        
        // Cập nhật thumbnail
        previewContainer.innerHTML = `<img src="${previewCanvas.toDataURL('image/jpeg', 0.8)}" alt="Preview">`;
        
    } catch (error) {
        console.error('❌ Lỗi update preview:', error);
    }
}
/**
 * Thêm nút cài đặt chất lượng mặc định vào header
 */
function addQualitySettingsButton() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    // Kiểm tra đã có nút chưa
    if (document.getElementById('btnQualitySettings')) return;
    
    const qualityButton = document.createElement('button');
    qualityButton.id = 'btnQualitySettings';
    qualityButton.className = 'quality-settings-btn';
    qualityButton.title = 'Cài đặt chất lượng ảnh';
    qualityButton.innerHTML = '<i class="fas fa-image"></i>';
    qualityButton.style.cssText = `
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        margin-right: 8px;
        transition: all 0.3s;
    `;
    
    // Sự kiện click
    qualityButton.onclick = function(e) {
        e.stopPropagation();
        showQualitySettingsModal();
    };
    
    // Chèn vào header
    const editButton = headerRight.querySelector('#btnEditMode');
    if (editButton) {
        headerRight.insertBefore(qualityButton, editButton);
    } else {
        headerRight.appendChild(qualityButton);
    }
    
    console.log('✅ Đã thêm nút cài đặt chất lượng');
}

/**
 * Hiển thị modal cài đặt chất lượng
 */
function showQualitySettingsModal() {
    const modalHTML = `
        <div class="modal fade" id="qualitySettingsModal" tabindex="-1">
            <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-cog"></i> Cài đặt ảnh mặc định
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">Chất lượng ảnh sẽ áp dụng cho lần upload tiếp theo</p>
                        
                        <div class="quality-presets">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="defaultQuality" 
                                       id="default_low" value="low">
                                <label class="form-check-label" for="default_low">
                                    <strong>Nhẹ</strong>
                                    <small class="d-block text-muted">120×72px • Tiết kiệm dung lượng</small>
                                </label>
                            </div>
                            
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="radio" name="defaultQuality" 
                                       id="default_medium" value="medium" checked>
                                <label class="form-check-label" for="default_medium">
                                    <strong>Trung bình</strong>
                                    <small class="d-block text-muted">180×108px • Cân bằng</small>
                                </label>
                            </div>
                            
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="radio" name="defaultQuality" 
                                       id="default_high" value="high">
                                <label class="form-check-label" for="default_high">
                                    <strong>Cao</strong>
                                    <small class="d-block text-muted">240×144px • Chất lượng tốt</small>
                                </label>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <button class="btn btn-primary w-100" onclick="saveDefaultQuality()">
                                <i class="fas fa-save"></i> Lưu cài đặt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Thêm modal nếu chưa có
    if (!document.getElementById('qualitySettingsModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Load giá trị đã lưu
    const savedQuality = localStorage.getItem('defaultImageQuality') || 'high';
    document.querySelector(`#default_${savedQuality}`).checked = true;
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('qualitySettingsModal'));
    modal.show();
}

/**
 * Lưu cài đặt chất lượng mặc định
 */
function saveDefaultQuality() {
    const selectedQuality = document.querySelector('input[name="defaultQuality"]:checked')?.value || 'high';
    
    localStorage.setItem('defaultImageQuality', selectedQuality);
    
    // Đóng modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('qualitySettingsModal'));
    if (modal) modal.hide();
    
    // Thông báo
    Utils.showToast(`Đã đặt chất lượng mặc định: ${selectedQuality}`, 'success');
}

// Cập nhật hàm initEditMode để thêm nút quality
function initEditMode() {
    addEditButtonToHeader();
    addQualitySettingsButton(); // THÊM DÒNG NÀY
    setupEditModeListeners();
}
/**
 * Lưu ảnh đã crop với chất lượng được chọn
 */
async function saveCroppedImage() {
    if (!currentEditingProduct || !cropEditor || !cropEditor.image) {
        showCropError('Không có ảnh để lưu');
        return;
    }
    
    try {
        showCropLoading();
        
        // Lấy cài đặt chất lượng từ UI
        const qualitySettings = getQualitySettings();
        
        // Tính toán crop parameters
        const { offsetX, offsetY, scale, imageWidth, imageHeight } = cropEditor.cropData;
        const containerWidth = cropEditor.canvas.width;
        const containerHeight = cropEditor.canvas.height;
        
        // Tính phần ảnh gốc được hiển thị
        const sourceX = -offsetX / scale;
        const sourceY = -offsetY / scale;
        const sourceWidth = containerWidth / scale;
        const sourceHeight = containerHeight / scale;
        
        console.log('📐 Crop parameters:', {
            sourceX, sourceY, sourceWidth, sourceHeight,
            imageWidth, imageHeight, scale,
            quality: qualitySettings.quality
        });
        
        // Tạo canvas crop với kích thước container
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = containerWidth;
        cropCanvas.height = containerHeight;
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCtx.imageSmoothingEnabled = true;
        cropCtx.imageSmoothingQuality = 'high';
        
        // Vẽ phần ảnh được crop
        cropCtx.drawImage(
            cropEditor.image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, containerWidth, containerHeight
        );
        
        // Nén với chất lượng đã chọn
        const compressed = await window.compressToIcon(cropCanvas.toDataURL('image/jpeg', 0.9), {
            quality: qualitySettings.quality,
            jpegQuality: qualitySettings.jpegQuality,
            thumbnailQuality: qualitySettings.thumbnailQuality
        });
        
        // Lưu vào IndexedDB
        const imageObject = createProductImageObject(
            currentEditingProduct,
            currentHKD.id,
            compressed.imageData,
            {
                thumbnail: compressed.thumbnail,
                originalData: cropEditor.originalImageData,
                type: 'upload',
                source: 'Crop Editor',
                format: compressed.format,
                size: compressed.size,
                compressedSize: compressed.imageData.length,
                width: compressed.width,
                height: compressed.height,
                quality: compressed.quality,
                jpegQuality: compressed.jpegQuality
            }
        );
        
        await saveProductImage(imageObject);
        // Cập nhật cache và DOM ngay lập tức
    if (typeof window.updateProductImageAfterSave === 'function') {
        await window.updateProductImageAfterSave(currentEditingProduct, imageObject);
    } else {
        // Fallback: reload trang
        location.reload();
    }
        // Cập nhật UI
        await reloadProductImage(currentEditingProduct);
        
        // Thông báo thành công với thông tin chất lượng
        const qualityNames = {
            'low': 'Nhẹ',
            'medium': 'Trung bình', 
            'high': 'Cao',
            'original': 'Gốc'
        };
        
        showCropSuccess(`Đã lưu ảnh (${qualityNames[qualitySettings.quality]})!`);
        
        // Đóng editor sau 1.5s
        setTimeout(() => {
            closeCropEditor();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Lỗi lưu ảnh:', error);
        showCropError('Lỗi lưu ảnh: ' + error.message);
    } finally {
        hideCropLoading();
    }
}

// ========== UI HELPER FUNCTIONS ==========

function showCropLoading() {
    const loading = document.getElementById('cropLoading');
    if (loading) loading.style.display = 'flex';
}

function hideCropLoading() {
    const loading = document.getElementById('cropLoading');
    if (loading) loading.style.display = 'none';
}

function showCropError(message) {
    const errorDiv = document.getElementById('cropError');
    const errorMessage = document.getElementById('cropErrorMessage');
    
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'flex';
        
        // Tự động ẩn sau 5s
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function hideCropError() {
    const errorDiv = document.getElementById('cropError');
    if (errorDiv) errorDiv.style.display = 'none';
}

function showCropSuccess(message) {
    // Tạo success message
    const successDiv = document.createElement('div');
    successDiv.className = 'crop-success';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    // Chèn vào trước crop controls
    const cropControls = document.querySelector('.crop-controls');
    if (cropControls && cropControls.parentNode) {
        cropControls.parentNode.insertBefore(successDiv, cropControls);
        
        // Tự động xóa sau 3s
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
}

// ========== EXPORT FUNCTIONS ==========

window.toggleEditMode = toggleEditMode;
window.editProductInfo = editProductInfo;
window.editProductImage = editProductImage;
window.rotateCrop = rotateCrop;
window.centerCrop = centerCrop;
window.resetCrop = resetCrop;
window.closeCropEditor = closeCropEditor;

// Khởi tạo khi load page
document.addEventListener('DOMContentLoaded', function() {
    // Đợi một chút để page load xong
    setTimeout(() => {
        if (currentHKD && currentHKD.role === 'hkd') {
            initEditMode();
        }
    }, 1000);
});