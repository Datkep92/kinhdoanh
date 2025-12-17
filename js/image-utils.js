/**
 * Nén ảnh với nhiều mức chất lượng - FIXED VERSION
 */
async function compressToIcon(file, options = {}) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Cài đặt mặc định
        const settings = {
            quality: options.quality || 'high',
            targetWidth: options.targetWidth || null,
            targetHeight: options.targetHeight || null,
            jpegQuality: options.jpegQuality || 0.85,
            thumbnailQuality: options.thumbnailQuality || 0.7
        };
        
        img.onload = () => {
            try {
                console.log(`🖼️ Nén ảnh với chất lượng: ${settings.quality}`);
                console.log(`📐 Kích thước gốc: ${img.width}x${img.height}`);
                
                // Xác định kích thước dựa trên chất lượng - SỬA Ở ĐÂY
                let targetSize;
                switch(settings.quality) {
                    case 'low':
                        targetSize = { width: 120, height: 72 };
                        settings.jpegQuality = 0.6;
                        break;
                    case 'medium':
                        targetSize = { width: 180, height: 108 };
                        settings.jpegQuality = 0.75;
                        break;
                    case 'high':
                        targetSize = { width: 240, height: 144 };
                        settings.jpegQuality = 0.85;
                        break;
                    case 'original':
                        // Giữ nguyên tỷ lệ, max 480px chiều rộng
                        const maxWidth = 480;
                        const scale = Math.min(1, maxWidth / img.width); // ĐẢM BẢO scale <= 1
                        targetSize = {
                            width: Math.round(img.width * scale),
                            height: Math.round(img.height * scale)
                        };
                        settings.jpegQuality = 0.9;
                        console.log(`📏 Scale: ${scale}, Target: ${targetSize.width}x${targetSize.height}`);
                        break;
                    default:
                        targetSize = { width: 240, height: 144 };
                }
                
                // Ưu tiên kích thước custom nếu có
                if (settings.targetWidth && settings.targetHeight) {
                    targetSize = {
                        width: settings.targetWidth,
                        height: settings.targetHeight
                    };
                }
                
                console.log(`🎯 Kích thước đích: ${targetSize.width}x${targetSize.height}`);
                
                // KIỂM TRA KÍCH THƯỚC HỢP LỆ
                if (targetSize.width <= 0 || targetSize.height <= 0 || 
                    isNaN(targetSize.width) || isNaN(targetSize.height)) {
                    console.error('❌ Kích thước đích không hợp lệ:', targetSize);
                    // Fallback về high quality
                    targetSize = { width: 240, height: 144 };
                    settings.jpegQuality = 0.85;
                    console.log(`🔄 Fallback về: ${targetSize.width}x${targetSize.height}`);
                }
                
                // Tạo canvas với kích thước đích
                const canvas = document.createElement('canvas');
                canvas.width = targetSize.width;
                canvas.height = targetSize.height;
                
                const ctx = canvas.getContext('2d');
                
                // Thiết lập chất lượng vẽ
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Tính toán để ảnh cover canvas (giữ tỷ lệ)
                const imgRatio = img.width / img.height;
                const canvasRatio = targetSize.width / targetSize.height;
                
                let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
                
                console.log(`📊 Tỷ lệ: Ảnh=${imgRatio.toFixed(2)}, Canvas=${canvasRatio.toFixed(2)}`);
                
                if (imgRatio > canvasRatio) {
                    // Ảnh rộng hơn -> crop chiều rộng
                    sourceWidth = img.height * canvasRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                } else {
                    // Ảnh cao hơn -> crop chiều cao
                    sourceHeight = img.width / canvasRatio;
                    sourceY = (img.height - sourceHeight) / 2;
                }
                
                console.log(`✂️ Crop area: ${Math.round(sourceX)},${Math.round(sourceY)} ${Math.round(sourceWidth)}x${Math.round(sourceHeight)}`);
                
                // Vẽ ảnh
                ctx.drawImage(
                    img, 
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, targetSize.width, targetSize.height
                );
                
                // Nén với chất lượng tương ứng
                if (typeof canvas.toBlob !== 'undefined') {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Không thể tạo blob từ canvas'));
                            return;
                        }
                        
                        console.log(`📦 Kích thước sau nén: ${Math.round(blob.size/1024)}KB`);
                        
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const compressedData = reader.result;
                            
                            // Tạo thumbnail (tỉ lệ 1:2 với ảnh gốc)
                            const thumbnailWidth = Math.max(60, Math.round(targetSize.width / 2));
                            const thumbnailHeight = Math.max(36, Math.round(targetSize.height / 2));
                            
                            const thumbnailCanvas = document.createElement('canvas');
                            thumbnailCanvas.width = thumbnailWidth;
                            thumbnailCanvas.height = thumbnailHeight;
                            const thumbnailCtx = thumbnailCanvas.getContext('2d');
                            
                            thumbnailCtx.imageSmoothingEnabled = true;
                            thumbnailCtx.imageSmoothingQuality = 'high';
                            
                            thumbnailCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);
                            thumbnailCanvas.toBlob((thumbBlob) => {
                                if (!thumbBlob) {
                                    resolve({
                                        imageData: compressedData,
                                        thumbnail: compressedData, // Fallback
                                        size: blob.size,
                                        format: blob.type,
                                        width: targetSize.width,
                                        height: targetSize.height,
                                        quality: settings.quality,
                                        jpegQuality: settings.jpegQuality,
                                        originalWidth: img.width,
                                        originalHeight: img.height
                                    });
                                    return;
                                }
                                
                                const thumbReader = new FileReader();
                                thumbReader.onloadend = () => {
                                    resolve({
                                        imageData: compressedData,
                                        thumbnail: thumbReader.result,
                                        size: blob.size,
                                        format: blob.type,
                                        width: targetSize.width,
                                        height: targetSize.height,
                                        quality: settings.quality,
                                        jpegQuality: settings.jpegQuality,
                                        originalWidth: img.width,
                                        originalHeight: img.height
                                    });
                                };
                                thumbReader.readAsDataURL(thumbBlob);
                            }, 'image/jpeg', settings.thumbnailQuality);
                        };
                        reader.readAsDataURL(blob);
                    }, 'image/jpeg', settings.jpegQuality);
                } else {
                    // Fallback
                    const compressedData = canvas.toDataURL('image/jpeg', settings.jpegQuality);
                    
                    // Tạo thumbnail
                    const thumbnailWidth = Math.max(60, Math.round(targetSize.width / 2));
                    const thumbnailHeight = Math.max(36, Math.round(targetSize.height / 2));
                    
                    const thumbnailCanvas = document.createElement('canvas');
                    thumbnailCanvas.width = thumbnailWidth;
                    thumbnailCanvas.height = thumbnailHeight;
                    const thumbnailCtx = thumbnailCanvas.getContext('2d');
                    thumbnailCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);
                    const thumbnailData = thumbnailCanvas.toDataURL('image/jpeg', settings.thumbnailQuality);
                    
                    resolve({
                        imageData: compressedData,
                        thumbnail: thumbnailData,
                        size: Math.round(compressedData.length * 0.75),
                        format: 'image/jpeg',
                        width: targetSize.width,
                        height: targetSize.height,
                        quality: settings.quality,
                        originalWidth: img.width,
                        originalHeight: img.height
                    });
                }
            } catch (error) {
                console.error('❌ Lỗi nén ảnh:', error);
                reject(new Error(`Lỗi nén ảnh: ${error.message}`));
            }
        };
        
        img.onerror = () => {
            console.error('❌ Không thể tải ảnh');
            reject(new Error('Không thể tải ảnh'));
        };
        
        // Xử lý input
        if (typeof file === 'string') {
            img.src = file;
        } else if (file instanceof File || file instanceof Blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('📄 Đã đọc file, bắt đầu load ảnh...');
                img.src = e.target.result;
            };
            reader.onerror = () => {
                console.error('❌ Lỗi đọc file');
                reject(new Error('Lỗi đọc file'));
            };
            reader.readAsDataURL(file);
        } else if (file && file.imageData) {
            // Nếu là object từ canvas.toDataURL()
            console.log('🎨 Nhận canvas data URL');
            img.src = file.imageData || file;
        } else {
            console.error('❌ Định dạng file không hợp lệ:', file);
            reject(new Error('Định dạng file không hợp lệ'));
        }
    });
}
/**
 * Lấy cài đặt chất lượng từ UI
 * @returns {Object} Quality settings
 */
function getQualitySettings() {
    const selectedQuality = document.querySelector('input[name="quality"]:checked')?.value || 'high';
    
    const settings = {
        quality: selectedQuality,
        jpegQuality: 0.85,
        thumbnailQuality: 0.7
    };
    
    // Điều chỉnh chất lượng JPEG theo lựa chọn
    switch(selectedQuality) {
        case 'low':
            settings.jpegQuality = 0.6;
            settings.thumbnailQuality = 0.5;
            break;
        case 'medium':
            settings.jpegQuality = 0.75;
            settings.thumbnailQuality = 0.6;
            break;
        case 'high':
            settings.jpegQuality = 0.85;
            settings.thumbnailQuality = 0.7;
            break;
        case 'original':
            settings.jpegQuality = 0.9;
            settings.thumbnailQuality = 0.8;
            break;
    }
    
    console.log(`⚙️ Chất lượng đã chọn: ${selectedQuality}, JPEG: ${settings.jpegQuality}`);
    return settings;
}
/**
 * Crop ảnh theo vùng chọn
 * @param {string} imageData - Base64 ảnh gốc
 * @param {Object} cropArea - {x, y, width, height}
 * @param {number} outputSize - Kích thước đầu ra
 * @returns {Promise<string>} Base64 ảnh đã crop
 */
async function cropImage(imageData, cropArea, outputSize = 120) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = outputSize;
                canvas.height = outputSize;
                const ctx = canvas.getContext('2d');
                
                // Vẽ phần ảnh được crop và scale lên outputSize
                ctx.drawImage(
                    img,
                    cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source
                    0, 0, outputSize, outputSize // Destination
                );
                
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            } catch (error) {
                reject(new Error(`Lỗi crop ảnh: ${error.message}`));
            }
        };
        
        img.onerror = () => {
            reject(new Error('Không thể tải ảnh để crop'));
        };
        
        img.src = imageData;
    });
}

/**
 * Xoay ảnh
 * @param {string} imageData - Base64
 * @param {number} degrees - Góc xoay (90, 180, 270)
 * @returns {Promise<string>} Base64 ảnh đã xoay
 */
async function rotateImage(imageData, degrees) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                
                // Nếu xoay 90 hoặc 270 độ, đảo chiều width/height
                if (degrees === 90 || degrees === 270) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                
                const ctx = canvas.getContext('2d');
                
                // Di chuyển gốc tọa độ đến giữa canvas
                ctx.translate(canvas.width / 2, canvas.height / 2);
                
                // Xoay
                const radians = degrees * Math.PI / 180;
                ctx.rotate(radians);
                
                // Vẽ ảnh
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } catch (error) {
                reject(new Error(`Lỗi xoay ảnh: ${error.message}`));
            }
        };
        
        img.onerror = () => {
            reject(new Error('Không thể tải ảnh để xoay'));
        };
        
        img.src = imageData;
    });
}

/**
 * Tải ảnh từ URL và convert sang base64
 * @param {string} url - URL ảnh
 * @returns {Promise<string>} Base64
 */
async function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        // Tạo proxy URL để tránh CORS
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        
        fetch(proxyUrl)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result);
                };
                reader.onerror = () => {
                    reject(new Error('Lỗi đọc ảnh từ URL'));
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                reject(new Error(`Lỗi tải ảnh từ URL: ${error.message}`));
            });
    });
}

/**
 * Lấy ảnh từ camera
 * @returns {Promise<string>} Base64 ảnh
 */
async function captureFromCamera() {
    return new Promise((resolve, reject) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            reject(new Error('Trình duyệt không hỗ trợ camera'));
            return;
        }
        
        // Tạo video element
        const video = document.createElement('video');
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.zIndex = '9999';
        
        // Tạo canvas để chụp
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Tạo nút chụp
        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Chụp ảnh';
        captureBtn.style.position = 'fixed';
        captureBtn.style.bottom = '20px';
        captureBtn.style.left = '50%';
        captureBtn.style.transform = 'translateX(-50%)';
        captureBtn.style.zIndex = '10000';
        captureBtn.style.padding = '12px 24px';
        captureBtn.style.background = '#4a6ee0';
        captureBtn.style.color = 'white';
        captureBtn.style.border = 'none';
        captureBtn.style.borderRadius = '8px';
        captureBtn.style.fontSize = '16px';
        
        // Tạo nút hủy
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Hủy';
        cancelBtn.style.position = 'fixed';
        cancelBtn.style.bottom = '20px';
        cancelBtn.style.right = '20px';
        cancelBtn.style.zIndex = '10000';
        cancelBtn.style.padding = '12px 24px';
        cancelBtn.style.background = '#ef4444';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '8px';
        cancelBtn.style.fontSize = '16px';
        
        // Thêm vào body
        document.body.appendChild(video);
        document.body.appendChild(captureBtn);
        document.body.appendChild(cancelBtn);
        
        // Lấy stream từ camera
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment', // Camera sau
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            
            // Sự kiện chụp ảnh
            captureBtn.onclick = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                
                // Dọn dẹp
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(video);
                document.body.removeChild(captureBtn);
                document.body.removeChild(cancelBtn);
                
                resolve(imageData);
            };
            
            // Sự kiện hủy
            cancelBtn.onclick = () => {
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(video);
                document.body.removeChild(captureBtn);
                document.body.removeChild(cancelBtn);
                reject(new Error('Người dùng đã hủy'));
            };
        })
        .catch(error => {
            // Dọn dẹp nếu có lỗi
            if (document.body.contains(video)) document.body.removeChild(video);
            if (document.body.contains(captureBtn)) document.body.removeChild(captureBtn);
            if (document.body.contains(cancelBtn)) document.body.removeChild(cancelBtn);
            
            reject(new Error(`Lỗi truy cập camera: ${error.message}`));
        });
    });
}

/**
 * Tính kích thước file từ base64
 * @param {string} base64 - Chuỗi base64
 * @returns {number} Kích thước tính bằng bytes
 */
function getBase64Size(base64) {
    // Loại bỏ phần header "data:image/...;base64,"
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    
    // Tính kích thước: mỗi 4 ký tự base64 = 3 bytes
    return (base64Data.length * 3) / 4;
}

// Export các hàm
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        compressToIcon,
        cropImage,
        rotateImage,
        loadImageFromUrl,
        captureFromCamera,
        getBase64Size
    };
}