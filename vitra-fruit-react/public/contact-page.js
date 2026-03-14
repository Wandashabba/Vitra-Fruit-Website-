(function () {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');
  const endpoint = 'https://formsubmit.co/ajax/vitrafruits@gmail.com';

  if (!form || !submitBtn || !status) {
    return;
  }

  const fields = {
    fullName: document.getElementById('fullName'),
    emailAddress: document.getElementById('emailAddress'),
    phoneNumber: document.getElementById('phoneNumber'),
    message: document.getElementById('message')
  };

  const errorNodes = {
    fullName: document.getElementById('fullNameError'),
    emailAddress: document.getElementById('emailAddressError'),
    phoneNumber: document.getElementById('phoneNumberError'),
    message: document.getElementById('messageError')
  };

  const setFieldError = function (key, message) {
    const field = fields[key];
    const errorNode = errorNodes[key];
    if (field) {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    if (errorNode) {
      errorNode.textContent = message || '';
    }
  };

  const clearFieldErrors = function () {
    Object.keys(errorNodes).forEach(function (key) {
      setFieldError(key, '');
    });
  };

  const validateForm = function () {
    clearFieldErrors();

    let isValid = true;
    let firstInvalidField = null;

    const nameValue = (fields.fullName && fields.fullName.value ? fields.fullName.value : '').trim();
    if (nameValue.length < 2) {
      setFieldError('fullName', 'Please enter your full name.');
      isValid = false;
      firstInvalidField = firstInvalidField || fields.fullName;
    }

    const emailValue = (fields.emailAddress && fields.emailAddress.value ? fields.emailAddress.value : '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)) {
      setFieldError('emailAddress', 'Please enter a valid email address.');
      isValid = false;
      firstInvalidField = firstInvalidField || fields.emailAddress;
    }

    const phoneValue = (fields.phoneNumber && fields.phoneNumber.value ? fields.phoneNumber.value : '').trim();
    if (phoneValue && !/^[+0-9()\-\s]{7,20}$/.test(phoneValue)) {
      setFieldError('phoneNumber', 'Please enter a valid phone number.');
      isValid = false;
      firstInvalidField = firstInvalidField || fields.phoneNumber;
    }

    const messageValue = (fields.message && fields.message.value ? fields.message.value : '').trim();
    if (messageValue.length < 10) {
      setFieldError('message', 'Message should be at least 10 characters.');
      isValid = false;
      firstInvalidField = firstInvalidField || fields.message;
    }

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  };

  Object.keys(fields).forEach(function (key) {
    const field = fields[key];
    if (!field) return;
    field.addEventListener('input', function () {
      setFieldError(key, '');
    });
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    status.textContent = '';
    status.className = 'status';

    if (!validateForm()) {
      status.textContent = 'Please fix the highlighted fields and try again.';
      status.classList.add('error');
      return;
    }

    const data = new FormData(form);
    if ((data.get('_honey') || '').trim() !== '') {
      status.textContent = 'Submission blocked.';
      status.classList.add('error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      });
      const result = await response.json().catch(function () { return {}; });
      const isSuccess = result && (result.success === true || result.success === 'true');

      if (response.ok && isSuccess) {
        form.reset();
        clearFieldErrors();
        status.textContent = 'Message sent successfully. We will contact you soon.';
        status.classList.add('success');
      } else {
        status.textContent = 'Could not send message right now. Please try again shortly.';
        status.classList.add('error');
      }
    } catch (error) {
      status.textContent = 'Network error. Please check your connection and try again.';
      status.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
})();
