// ==UserScript==
// @name         Rakuten Image Downloader with Dynamic Prefix
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Manually trigger image downloads on Rakuten item detail pages, using the item code as the file name prefix.
// @author       minyoon
// @homepageURL  https://github.com/minyoon/rakuten-parser
// @downloadURL  https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// @updateURL    https://github.com/minyoon/rakuten-parser/raw/main/description-image-downloader.user.js
// @match        https://item.rakuten.co.jp/*/*
// @match        https://soko.rms.rakuten.co.jp/*
// @grant        GM_download
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    console.log('Rakuten Image Download Script is running on', window.location.href);

    // Only run on item or soko Rakuten pages
    const urlRegex = /^https:\/\/(?:item|soko)\.rakuten\.co\.jp\/.*$/;
    if (!urlRegex.test(window.location.href)) {
        console.warn('URL does not match, script will not run.');
        return;
    }

    /** Applies multiple styles to a DOM element. */
    const applyStyles = (element, styles) => Object.assign(element.style, styles);

    /** Adds a subtle hover effect (opacity + slight scale) to an element. */
    function addHoverEffects(element) {
        element.addEventListener('mouseover', () => {
            element.style.opacity = '1';
            element.style.transform = 'scale(1.05)';
        });
        element.addEventListener('mouseout', () => {
            element.style.opacity = '0.7';
            element.style.transform = 'scale(1)';
        });
    }

    /** Extracts the file prefix from the current URL path (the penultimate segment). */
    function getFilePrefix() {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 2] || 'no-prefix';
    }

    /** Handles the image downloads within <span class="sale_desc">. */
    function downloadImages(filePrefix) {
        const images = document.querySelectorAll('span.sale_desc img');
        if (images.length === 0) {
            console.warn('No images found to download.');
            return;
        }
        images.forEach((img, i) => {
            const [extension] = img.src.split('.').pop().split('?');
            GM_download({
                url: img.src,
                name: `${filePrefix}-${i + 1}.${extension}`,
                onerror: err => console.error('Download error:', err),
            });
        });
    }

    /** Creates and injects the "Download Images" + "X" buttons. */
    function addDownloadButton() {
        const container = document.createElement('div');
        container.id = 'buttonContainer';
        applyStyles(container, {
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            zIndex: '2147483647',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: '0.7',
            transition: 'all 0.3s ease',
            padding: '4px 4px 4px 12px',
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
        });

        // Counter display
        const counter = document.createElement('span');
        counter.textContent = `${document.querySelectorAll('span.sale_desc img').length} images`;
        applyStyles(counter, {
            fontSize: '12px',
            color: '#666',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            order: '1',
        });

        // Main download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadImagesButton';
        downloadBtn.innerHTML = '⬇️';
        downloadBtn.title = 'Download All Images';
        applyStyles(downloadBtn, {
            border: 'none',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#000000',
            width: '40px',
            height: '40px',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            order: '2',
        });

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Hide Controls';
        applyStyles(closeBtn, {
            border: 'none',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#666',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            cursor: 'pointer',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            order: '3',
        });

        // Add preview container
        const previewContainer = document.createElement('div');
        previewContainer.id = 'previewContainer';
        applyStyles(previewContainer, {
            position: 'fixed',
            bottom: '100px',
            right: '40px',
            display: 'none',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: '2147483646'
        });

        // Add header to preview
        const previewHeader = document.createElement('div');
        applyStyles(previewHeader, {
            borderBottom: '1px solid #eee',
            paddingBottom: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#333',
            fontWeight: 'bold'
        });

        const images = document.querySelectorAll('span.sale_desc img');
        previewHeader.textContent = `${images.length} Images Available`;
        previewContainer.appendChild(previewHeader);

        // Create thumbnails container
        const thumbnailsContainer = document.createElement('div');
        applyStyles(thumbnailsContainer, {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
        });
        previewContainer.appendChild(thumbnailsContainer);

        // Create enlarged preview element
        const enlargedPreview = document.createElement('div');
        applyStyles(enlargedPreview, {
            position: 'fixed',
            display: 'none',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: '2147483647',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        });
        document.body.appendChild(enlargedPreview);

        // Create thumbnails
        images.forEach((img, index) => {
            const thumbnail = document.createElement('div');
            applyStyles(thumbnail, {
                width: '80px',
                height: '80px',
                backgroundImage: `url(${img.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '4px',
                border: '1px solid #eee',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s'
            });

            const number = document.createElement('div');
            number.textContent = index + 1;
            applyStyles(number, {
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '10px'
            });

            // Handle hover enlargement
            thumbnail.addEventListener('mouseover', (e) => {
                const enlargedImg = new Image();
                enlargedImg.src = img.src;
                enlargedImg.style.maxWidth = '800px';
                enlargedImg.style.maxHeight = '80vh';
                enlargedImg.style.objectFit = 'contain';

                enlargedPreview.innerHTML = '';
                enlargedPreview.appendChild(enlargedImg);

                enlargedPreview.style.display = 'block';
                thumbnail.style.transform = 'scale(1.05)';
            });

            thumbnail.addEventListener('mouseout', () => {
                enlargedPreview.style.display = 'none';
                thumbnail.style.transform = 'scale(1)';
            });

            // Handle click to download
            thumbnail.addEventListener('click', () => {
                GM_download({
                    url: img.src,
                    name: img.title || `${getFilePrefix()}-${index + 1}.${img.src.split('.').pop().split('?')[0]}`,
                    onerror: err => console.error('Download error:', err),
                });
            });

            thumbnail.appendChild(number);
            thumbnailsContainer.appendChild(thumbnail);
        });

        // Fix hover behavior
        let isHovering = false;

        container.addEventListener('mouseover', () => {
            container.style.opacity = '1';
            closeBtn.style.opacity = '1';
            counter.style.opacity = '1';
        });

        container.addEventListener('mouseout', () => {
            if (!isHovering) {
                container.style.opacity = '0.7';
                closeBtn.style.opacity = '0';
                counter.style.opacity = '0';
            }
        });

        downloadBtn.addEventListener('mouseover', () => {
            isHovering = true;
            previewContainer.style.display = 'flex';
        });

        previewContainer.addEventListener('mouseover', () => {
            isHovering = true;
            container.style.opacity = '1';
            closeBtn.style.opacity = '1';
            counter.style.opacity = '1';
        });

        previewContainer.addEventListener('mouseleave', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    previewContainer.style.display = 'none';
                    container.style.opacity = '0.7';
                    closeBtn.style.opacity = '0';
                    counter.style.opacity = '0';
                }
            }, 100);
        });

        downloadBtn.addEventListener('mouseleave', () => {
            isHovering = false;
            setTimeout(() => {
                if (!isHovering) {
                    previewContainer.style.display = 'none';
                }
            }, 100);
        });

        downloadBtn.addEventListener('click', () => {
            downloadBtn.style.transform = 'scale(0.95)';
            setTimeout(() => downloadBtn.style.transform = 'scale(1)', 100);
            downloadImages(getFilePrefix());
        });

        closeBtn.addEventListener('click', () => {
            container.remove();
            previewContainer.remove();
            enlargedPreview.remove();
        });

        container.appendChild(counter);
        container.appendChild(downloadBtn);
        container.appendChild(closeBtn);
        document.body.appendChild(container);
        document.body.appendChild(previewContainer);
    }

    /**
     * Tries to find images in <span class="sale_desc"> up to `maxRetries` times,
     * then creates the button if found.
     */
    function waitForContent(maxRetries = 10) {
        const images = document.querySelectorAll('span.sale_desc img');
        if (images.length > 0) {
            addDownloadButton();
        } else if (maxRetries > 0) {
            setTimeout(() => waitForContent(maxRetries - 1), 1000);
        } else {
            console.warn('No images found after retries.');
        }
    }

    // Start the process after the page has fully loaded
    window.addEventListener('load', () => {
        waitForContent(10);
    });
  })();