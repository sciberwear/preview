  <script>
  const tabs = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');
  const fullVideo = document.getElementById('fullVideo');

  let currentTab = 'full';

  function switchTab(id) {
    if (id !== 'full') fullVideo.pause();
    tabs.forEach(btn => btn.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));
    document.querySelector(`[onclick*="${id}"]`).classList.add('active');
    document.getElementById(id).classList.add('active');

    if (id === 'full') {
      fullVideo.currentTime = 0;
      fullVideo.play();
    }

    currentTab = id;
  }

  function togglePlay(id, button) {
    const video = document.getElementById(id);
    if (video.paused) {
      video.play();
      button.textContent = 'Pause';
    } else {
      video.pause();
      button.textContent = 'Play';
    }
  }

  function restartVideo(id) {
    const video = document.getElementById(id);
    video.currentTime = 0;
    video.play();
  }

  function setupProgress(videoId, progressId) {
    const video = document.getElementById(videoId);
    const progress = document.getElementById(progressId);
    video.addEventListener('timeupdate', () => {
      const percent = (video.currentTime / video.duration) * 100;
      progress.value = percent;
      progress.style.setProperty('--progress', `${percent}%`);
    });
    progress.addEventListener('input', () => {
      video.currentTime = (progress.value / 100) * video.duration;
    });
  }

  setupProgress('fullVideo', 'fullProgress');

  function seekTo(videoId, time, el) {
    const video = document.getElementById(videoId);
    video.currentTime = time;
    video.play();
    document.querySelectorAll(`#${videoId}`).forEach(i => i.classList.remove('active'));
    el.classList.add('active');
  }

  const imageSources = {
    front: ["image1.svg", "image2.svg", "image3.svg"],
    back: ["image4.svg", "image5.svg"],
    additional: ["image6.svg", "image7.svg"]
  };

  const indices = { front: 0, back: 0, additional: 0 };

  function updateImage(tab) {
    const img = document.getElementById(`${tab}Image`);
    const indexSpan = document.getElementById(`${tab}Index`);
    img.src = `https://raw.githubusercontent.com/sciberwear/sciberwear-slideshow/refs/heads/main/Image/${imageSources[tab][indices[tab]]}`;
    indexSpan.textContent = indices[tab] + 1;
  }

  function nextImage(tab) {
    indices[tab] = (indices[tab] + 1) % imageSources[tab].length;
    updateImage(tab);
  }

  function prevImage(tab) {
    indices[tab] = (indices[tab] - 1 + imageSources[tab].length) % imageSources[tab].length;
    updateImage(tab);
  }

  ['front', 'back', 'additional'].forEach(tab => {
    updateImage(tab);
    const zoomSlider = document.getElementById(`${tab}Zoom`);
    const image = document.getElementById(`${tab}Image`);
    let isDragging = false, startX = 0, startY = 0, lastX = 0, lastY = 0;
    let lastTouchDistance = 0;
    let lastTap = 0;

    function applyTransform(scale = 1, dx = 0, dy = 0) {
      const wrapper = image.parentElement.getBoundingClientRect();
      const imgSize = {
        w: wrapper.width * scale,
        h: wrapper.height * scale
      };
      const bounds = {
        maxX: (imgSize.w - wrapper.width) / 2,
        maxY: (imgSize.h - wrapper.height) / 2
      };
      dx = Math.max(-bounds.maxX, Math.min(bounds.maxX, dx));
      dy = Math.max(-bounds.maxY, Math.min(bounds.maxY, dy));
      image.style.transform = `scale(${scale}) translate(${dx}px, ${dy}px)`;
      return { dx, dy };
    }

    zoomSlider.addEventListener('input', () => {
      const zoom = zoomSlider.value / 100;
      if (zoom === 1) {
        lastX = 0;
        lastY = 0;
        image.style.transform = `scale(1)`;
        zoomSlider.style.setProperty('--progress', `0%`);
      } else {
        const result = applyTransform(zoom, lastX, lastY);
        lastX = result.dx;
        lastY = result.dy;
        zoomSlider.style.setProperty('--progress', `${zoomSlider.value}%`);
      }
    });

    image.addEventListener('mousedown', (e) => {
      if (zoomSlider.value == 100) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      image.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - startX + lastX;
      const dy = e.clientY - startY + lastY;
      const zoom = zoomSlider.value / 100;
      const result = applyTransform(zoom, dx, dy);
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      lastX += dx;
      lastY += dy;
      isDragging = false;
      image.classList.remove('dragging');
    });

    // Touch support
    image.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        if (zoomSlider.value == 100) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        image.classList.add('dragging');

        const now = Date.now();
        if (now - lastTap < 300) {
          // double tap
          lastX = 0;
          lastY = 0;
          zoomSlider.value = 100;
          zoomSlider.dispatchEvent(new Event('input'));
        }
        lastTap = now;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    });

    image.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - startX + lastX;
        const dy = e.touches[0].clientY - startY + lastY;
        const zoom = zoomSlider.value / 100;
        applyTransform(zoom, dx, dy);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delta = distance - lastTouchDistance;
        lastTouchDistance = distance;
        let zoom = zoomSlider.valueAsNumber + delta * 0.2;
        zoom = Math.max(100, Math.min(300, zoom));
        zoomSlider.value = zoom;
        zoomSlider.dispatchEvent(new Event('input'));
      }
    });

    image.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        lastX += e.changedTouches[0].clientX - startX;
        lastY += e.changedTouches[0].clientY - startY;
        isDragging = false;
        image.classList.remove('dragging');
      }
    });
  });
</script>
