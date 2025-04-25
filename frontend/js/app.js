document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');
    const dataPreview = document.getElementById('dataPreview');
    
    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // Handle file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });
    
    // Process file
    async function handleFileUpload(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            // Show preview
            dataPreview.innerHTML = `
                <p><strong>File:</strong> ${result.filename}</p>
                <p><strong>Columns:</strong> ${result.columns.join(', ')}</p>
                <pre>${JSON.stringify(result.sample_data, null, 2)}</pre>
            `;
            
            previewArea.style.display = 'block';
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    async function handleFileUpload(file) {
        const formData = new FormData();
        formData.append('file', file);
    
        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Upload failed');
            
            const result = await response.json();
            
            // Enhanced preview
            dataPreview.innerHTML = `
                <h4>${result.filename}</h4>
                <table class="preview-table">
                    <tr>
                        ${result.columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                    ${result.sample_data.map(row => `
                        <tr>
                            ${result.columns.map(col => `<td>${row[col]}</td>`).join('')}
                        </tr>
                    `).join('')}
                </table>
                <div class="actions">
                    <button id="normalizeBtn">Normalize Taxonomy</button>
                    <button id="downloadBtn">Download Cleaned Data</button>
                </div>
            `;
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }
    
});