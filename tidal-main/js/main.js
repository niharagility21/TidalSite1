/**
 * TIDAL — Main JS
 * Nav, mobile menu, GSAP animations, counters, form
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ── SMOOTH SCROLL ──────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    });
  });

  /* ── NAV SCROLL ─────────────────────────────────────── */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 16);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── MOBILE MENU ────────────────────────────────────── */
  var burger     = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.classList.toggle('is-open', open);
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── GSAP ANIMATIONS ────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  // Hero — staggered entrance
  var heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  heroTl
    .from('.hero__badge',  { y: 20, opacity: 0, duration: 0.55 }, 0.12)
    .from('.hero__h1',     { y: 36, opacity: 0, duration: 0.70 }, 0.24)
    .from('.hero__sub',    { y: 24, opacity: 0, duration: 0.60 }, 0.36)
    .from('.hero__btns',   { y: 20, opacity: 0, duration: 0.55 }, 0.48)
    .from('.hero__chips',  { y: 16, opacity: 0, duration: 0.50 }, 0.60);

  // Hero card — slide in from right
  gsap.from('.hero__visual', {
    x: 60, opacity: 0, duration: 1.0, ease: 'power3.out', delay: 0.38
  });

  // How It Works
  gsap.from('.step', {
    scrollTrigger: { trigger: '#how-it-works', start: 'top 76%' },
    y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out'
  });

  // Results stats
  gsap.from('.stat-card', {
    scrollTrigger: { trigger: '#results', start: 'top 78%' },
    opacity: 0, y: 30,
    duration: 0.6, ease: 'power2.out'
  });

  // Testimonial
  gsap.from('.testimonial', {
    scrollTrigger: { trigger: '.testimonial', start: 'top 83%' },
    y: 30, opacity: 0, duration: 0.7, ease: 'power2.out'
  });

  // FAQ section
  gsap.from('.faq__header', {
    scrollTrigger: { trigger: '#faq', start: 'top 78%' },
    y: 30, opacity: 0, duration: 0.6, ease: 'power2.out'
  });
  gsap.from('.faq-item', {
    scrollTrigger: { trigger: '.faq-list', start: 'top 82%' },
    y: 24, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out'
  });

  // Demo section
  gsap.from('.demo__left > *', {
    scrollTrigger: { trigger: '#demo', start: 'top 78%' },
    y: 30, opacity: 0, duration: 0.60, stagger: 0.11, ease: 'power2.out'
  });
  gsap.from('.demo-form-card', {
    scrollTrigger: { trigger: '#demo', start: 'top 78%' },
    y: 32, opacity: 0, duration: 0.70, delay: 0.12, ease: 'power2.out'
  });

  /* ── COUNTER ANIMATION ──────────────────────────────── */
  function animateCounter(el) {
    var target   = parseFloat(el.dataset.target);
    var suffix   = el.dataset.suffix   || '';
    var prefix   = el.dataset.prefix   || '';
    var decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    var duration = 1800;
    var startTs  = null;

    function step(ts) {
      if (!startTs) startTs = ts;
      var t     = Math.min((ts - startTs) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      var val   = eased * target;
      el.textContent = prefix + (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counterObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(function (el) {
    counterObs.observe(el);
  });

  /* ── DEMO FORM ──────────────────────────────────────── */
  var form        = document.getElementById('demo-form');
  var formBody    = document.getElementById('form-body');
  var formSuccess = document.getElementById('form-success');
  var formError   = document.getElementById('form-error');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Basic client-side validation
      var nameEl     = form.querySelector('[name=name]');
      var emailEl    = form.querySelector('[name=email]');
      var companyEl  = form.querySelector('[name=company]');
      var industryEl = form.querySelector('[name=industry]');
      var volumeEl   = form.querySelector('[name=rfq_volume]');

      if (!nameEl.value.trim() || !emailEl.value.trim() || !companyEl.value.trim() ||
          !industryEl.value || !volumeEl.value) {
        showError('Please fill in all fields before submitting.');
        return;
      }

      var btn      = form.querySelector('.form-submit');
      var origHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>&nbsp; Sending…';
      btn.disabled  = true;
      if (formError) formError.style.display = 'none';

      var payload = {
        name:       nameEl.value.trim(),
        email:      emailEl.value.trim(),
        company:    companyEl.value.trim(),
        industry:   industryEl.value,
        rfq_volume: volumeEl.value
      };

      fetch('/api/demo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok || result.data.ok) {
          if (formBody)    formBody.style.display = 'none';
          if (formSuccess) formSuccess.classList.add('visible');
        } else {
          throw new Error(result.data.error || 'Submission failed');
        }
      })
      .catch(function (err) {
        btn.innerHTML = origHtml;
        btn.disabled  = false;
        showError(err.message && err.message !== 'Submission failed'
          ? err.message
          : 'Something went wrong. Please email hello@tidalsoftware.ai directly.');
      });

      function showError(msg) {
        if (formError) {
          formError.textContent = msg;
          formError.style.display = 'block';
        }
      }
    });
  }

});
