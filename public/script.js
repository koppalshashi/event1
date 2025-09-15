document.addEventListener('DOMContentLoaded', () => {
    const nextButtons = document.querySelectorAll('.next-btn');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.step');
    const progressLines = document.querySelectorAll('.line');
    const backToHomeBtn = document.querySelector('.back-to-home-btn');

    let currentStep = 1;
    let registrationId = null;

    const showStep = (stepNumber) => {
        formSteps.forEach(step => step.classList.remove('active'));
        progressSteps.forEach(step => step.classList.remove('active', 'completed'));
        progressLines.forEach(line => line.classList.remove('completed-line'));

        document.getElementById(`form-step-${stepNumber}`).classList.add('active');

        for (let i = 1; i <= stepNumber; i++) {
            document.getElementById(`step${i}`).classList.add('active');
            if (i < stepNumber) {
                document.getElementById(`step${i}`).classList.add('completed');
                document.getElementById(`step${i}`).nextElementSibling.classList.add('completed-line');
            }
        }
    };

    showStep(currentStep);

    const validateStep = (stepNumber) => {
        let isValid = true;
        const currentStepEl = document.getElementById(`form-step-${stepNumber}`);
        const inputs = currentStepEl.querySelectorAll('input[required]');
        const select = currentStepEl.querySelector('select[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim() || (input.type === 'file' && input.files.length === 0)) {
                isValid = false;
                input.style.border = '1px solid red';
            } else {
                input.style.border = '';
            }
        });

        if (select) {
            const selectedValue = select.value;
            const customSelectBox = select.parentElement.querySelector('.custom-select');
            if (selectedValue === '') {
                isValid = false;
                customSelectBox.style.border = '1px solid red';
            } else {
                customSelectBox.style.border = '';
            }
        }

        if (!isValid) {
            alert("Please fill in all required fields.");
        }
        return isValid;
    };

    nextButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const nextStep = parseInt(button.dataset.nextStep);
            
            if (!validateStep(currentStep)) {
                return;
            }

            try {
                if (currentStep === 1) {
                    const studentName = document.getElementById('student-name').value;
                    const college = document.getElementById('college').value;
                    const studentEmail = document.getElementById('student-email').value;
                    const eventName = document.getElementById('event-name').value;

                    const response = await fetch('http://localhost:5000/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentName, college, email: studentEmail, event: eventName })
                    });
                    const data = await response.json();
                    if (data.registrationId) {
                        registrationId = data.registrationId;
                    } else {
                        throw new Error('No registration ID received.');
                    }
                } else if (currentStep === 3) {
                    const utrNumber = document.getElementById('utr-number').value;
                    const screenshotFile = document.getElementById('payment-screenshot').files[0];

                    const formData = new FormData();
                    formData.append('registrationId', registrationId);
                    formData.append('utrNumber', utrNumber);
                    formData.append('screenshot', screenshotFile);

                    const response = await fetch('http://localhost:5000/payment', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    console.log(data.message);
                }
                
                currentStep = nextStep;
                showStep(currentStep);
            } catch (error) {
                console.error('API call failed:', error);
                alert('Something went wrong. Please try again.');
            }
        });
    });

    backToHomeBtn.addEventListener('click', () => {
        document.querySelectorAll('input').forEach(input => {
            input.value = '';
            input.style.border = '';
        });

        const customSelect = document.querySelector('.custom-select');
        if (customSelect) {
            customSelect.querySelector('.select-selected').textContent = '-- Please Select --';
            customSelect.style.border = '';
        }

        const imagePreview = document.getElementById('image-preview');
        if (imagePreview) {
            imagePreview.src = '#';
            imagePreview.style.display = 'none';   // ✅ hide again
        }

        const customFileUpload = document.querySelector('.custom-file-upload');
        if (customFileUpload) customFileUpload.classList.remove('has-image');
        
        currentStep = 1;
        registrationId = null;
        showStep(currentStep);
    });

    const fileInput = document.getElementById('payment-screenshot');
    const imagePreview = document.getElementById('image-preview');
    const customFileUpload = document.querySelector('.custom-file-upload');

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';   // ✅ make visible
                customFileUpload.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = '#';
            imagePreview.style.display = 'none';   // ✅ hide again
            customFileUpload.classList.remove('has-image');
        }
    });

    // Custom Dropdown Logic
    const customSelects = document.querySelectorAll('.custom-select');

    customSelects.forEach(customSelect => {
        const selectSelected = customSelect.querySelector('.select-selected');
        const selectItems = customSelect.querySelector('.select-items');
        const originalSelect = customSelect.nextElementSibling;
        const selectItemsDivs = customSelect.querySelectorAll('.select-items div');

        selectSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSelect(selectSelected);
            selectItems.classList.toggle('select-hide');
            selectSelected.classList.toggle('select-arrow-active');
        });

        selectItemsDivs.forEach(itemDiv => {
            itemDiv.addEventListener('click', (e) => {
                selectSelected.textContent = e.target.textContent;
                originalSelect.value = e.target.textContent;
                selectSelected.classList.remove('select-arrow-active');
                selectItems.classList.add('select-hide');
            });
        });
    });

    document.addEventListener('click', closeAllSelect);

    function closeAllSelect(el) {
        const selectSelecteds = document.querySelectorAll('.select-selected');
        const selectItems = document.querySelectorAll('.select-items');

        selectSelecteds.forEach(item => {
            if (item !== el) {
                item.classList.remove('select-arrow-active');
            }
        });

        selectItems.forEach(item => {
            if (!item.classList.contains('select-hide')) {
                item.classList.add('select-hide');
            }
        });
    }
});
