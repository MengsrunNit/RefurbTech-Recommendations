import { reactive } from "vue";

export const store = reactive({
  selectedPhones: [],

  togglePhone(phone) {
    const index = this.selectedPhones.findIndex((p) => p.title === phone.title);
    if (index === -1) {
      if (this.selectedPhones.length >= 3) {
        alert("You can compare up to 3 phones at a time.");
        return;
      }
      this.selectedPhones.push(phone);
    } else {
      this.selectedPhones.splice(index, 1);
    }
  },

  isSelected(phone) {
    return this.selectedPhones.some((p) => p.title === phone.title);
  },

  clearSelection() {
    this.selectedPhones = [];
  },
});
