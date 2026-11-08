document.addEventListener("DOMContentLoaded", () => {
    let contacts = [];
    let editIndex = -1;

    const listViewToggle = document.getElementById("listViewToggle");
    const gridViewToggle = document.getElementById("gridViewToggle");
    const newContactBtn = document.getElementById("newContactBtn");
    const searchInput = document.getElementById("directorySearch");
    const listViewPanel = document.getElementById("listViewPanel");
    const listBody = document.getElementById("directoryListBody");
    const gridViewPanel = document.getElementById("gridViewPanel");
    const footer = document.getElementById("directoryFooter");
    const modal = new bootstrap.Modal(document.getElementById("contactFormModal"));
    const nameInput = document.getElementById("contactNameInput");
    const emailInput = document.getElementById("contactEmailInput");
    const phoneInput = document.getElementById("contactPhoneInput");
    const saveBtn = document.getElementById("saveContactBtn");

    // VIEW TOGGLE
    listViewToggle.addEventListener("click", () => {
        listViewPanel.classList.remove("d-none");
        gridViewPanel.classList.add("d-none");
        listViewToggle.classList.add("is-active");
        gridViewToggle.classList.remove("is-active");
        footer.classList.remove("directory-footer--grid");
        footer.classList.add("directory-footer--list");
    });

    gridViewToggle.addEventListener("click", () => {
        listViewPanel.classList.add("d-none");
        gridViewPanel.classList.remove("d-none");
        gridViewToggle.classList.add("is-active");
        listViewToggle.classList.remove("is-active");
        footer.classList.remove("directory-footer--list");
        footer.classList.add("directory-footer--grid");
    });

    function emptyState() {
        const row = document.createElement("tr");
        row.innerHTML = `
                <td colspan="4" class="directory-empty-state">No contacts added yet.</td>
            `;
        listBody.appendChild(row);
        searchInput.classList.add("d-none");
        gridViewToggle.classList.add("disabled");
    }

    function saveToLocalStorage() {
        localStorage.setItem('contacts', JSON.stringify(contacts));
    }

    function getFromLocalStorage() {
        return JSON.parse(localStorage.getItem('contacts')) || [];
    }

    // LOAD
    function loadContacts() {
        const localData = getFromLocalStorage();

        if (localData.length > 0) {
            contacts = localData;
            renderContacts(contacts);
            return;
        }

        fetch("https://jsonplaceholder.typicode.com/users")
            .then(res => {
                if (!res.ok) {
                    throw new Error("API failed");
                }
                return res.json();
            })
            .then(data => {
                contacts = data;
                saveToLocalStorage();
                renderContacts(contacts);
            })
            .catch(error => {
                console.error(error);
                emptyState();
                alert(`Failed to load contacts`);
            });
    }

    // INITIALS / INDEX TAB COLOR
    const tabPalette = 5;

    function getInitials(name) {
        const parts = name.trim().split(/\s+/);
        const first = parts[0] ? parts[0][0] : "";
        const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
        return (first + last).toUpperCase();
    }

    function getTabClass(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const bucket = (Math.abs(hash) % tabPalette) + 1;
        return `directory-index-tab--${bucket}`;
    }

    // RENDER
    function renderContacts(data) {
        listBody.innerHTML = "";
        gridViewPanel.innerHTML = "";

        data.forEach((c, index) => {
            const initials = getInitials(c.name);
            const tabClass = getTabClass(c.name);

            /* LIST ROW */
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div class="directory-entry-name">
                        <span class="directory-index-tab ${tabClass}">${initials}</span>
                        ${c.name}
                    </div>
                </td>
                <td class="d-none d-md-table-cell directory-entry-email">${c.email}</td>
                <td class="directory-entry-phone">${c.phone}</td>
                <td class="text-end">
                    <button class="directory-action-btn directory-action-btn--edit action-edit">
                        <i class="fa fa-pen"></i>
                    </button>
                    <button class="directory-action-btn directory-action-btn--delete action-delete">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            `;
            row.querySelector(".action-edit").addEventListener("click", () => openEdit(index));
            row.querySelector(".action-delete").addEventListener("click", () => deleteContact(index));
            listBody.appendChild(row);

            /* CARD */
            const col = document.createElement("div");
            col.className = "col-12 col-sm-6 col-md-4 mb-4";
            col.innerHTML = `
                <div class="directory-card">
                    <div class="directory-card__header">
                        <span class="directory-index-tab ${tabClass}">${initials}</span>
                        <h5 class="directory-card__name">${c.name}</h5>
                    </div>
                    <p class="directory-card__detail"><i class="fa fa-envelope"></i> ${c.email}</p>
                    <p class="directory-card__detail"><i class="fa fa-phone"></i> ${c.phone}</p>
                    <div class="directory-card__actions">
                        <button class="directory-action-btn directory-action-btn--edit action-edit">
                            <i class="fa fa-pen"></i>
                        </button>
                        <button class="directory-action-btn directory-action-btn--delete action-delete">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            col.querySelector(".action-edit").addEventListener("click", () => openEdit(index));
            col.querySelector(".action-delete").addEventListener("click", () => deleteContact(index));
            gridViewPanel.appendChild(col);
        });
    }

    function clearValidation() {
        [nameInput, emailInput, phoneInput].forEach(input => {
            input.classList.remove("is-invalid");
        });
    }

    function validateInputData() {
        let isValid = true;
        clearValidation();

        if (nameInput.value.trim() === "") {
            nameInput.classList.add("is-invalid");
            isValid = false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailInput.value.trim())) {
            emailInput.classList.add("is-invalid");
            isValid = false;
        }

        if (isNaN(phoneInput.value.trim())) {
            phoneInput.classList.add("is-invalid");
            isValid = false;
        }

        if (phoneInput.value.trim().length !== 10) {
            phoneInput.classList.add("is-invalid");
            isValid = false;
        }

        return isValid;
    }

    // NEW CONTACT
    newContactBtn.addEventListener("click", () => {
        editIndex = -1;
        nameInput.value = "";
        emailInput.value = "";
        phoneInput.value = "";
        saveBtn.textContent = 'Save';
        clearValidation();
        modal.show();
    });

    // EDIT
    function openEdit(index) {
        editIndex = index;
        const c = contacts[index];
        nameInput.value = c.name;
        emailInput.value = c.email;
        phoneInput.value = c.phone;
        saveBtn.textContent = 'Update';
        clearValidation();
        modal.show();
    }

    // SAVE (ADD + EDIT)
    saveBtn.addEventListener("click", () => {
        if (!validateInputData()) return;

        const newContact = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim()
        };

        if (editIndex === -1) {
            contacts.unshift(newContact);
        } else {
            contacts[editIndex] = newContact;
        }

        saveToLocalStorage();
        renderContacts(contacts);
        modal.hide();
    });

    // DELETE
    function deleteContact(index) {
        contacts.splice(index, 1);
        saveToLocalStorage();
        renderContacts(contacts);
    }

    // SEARCH
    searchInput.addEventListener("keyup", () => {
        const value = searchInput.value.toLowerCase();
        const filtered = contacts.filter(c =>
            c.name.toLowerCase().includes(value) ||
            c.phone.toLowerCase().includes(value)
        );
        renderContacts(filtered);
    });

    // INIT
    loadContacts();
});