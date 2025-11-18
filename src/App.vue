<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { z } from "zod";
import { fetchRooms, createBooking } from "@/lib/api";
import { getProfile } from "@/lib/liffClient";
import type { BookingPayload, Room, RoomCode } from "@/types/booking";

const rooms = ref<Room[]>([]);
const loadingRooms = ref(true);
const profileLoading = ref(true);
const submitting = ref(false);
const submitSuccess = ref<{ id: string; check_in: string; check_out: string } | null>(null);
const errorMessage = ref<string | null>(null);

const today = new Date();
today.setHours(0, 0, 0, 0);
const minDate = today.toISOString().split("T")[0];

const form = reactive({
  check_in: "",
  check_out: "",
  room_type: "single" as RoomCode,
  people: 1,
  name: "",
  phone: "",
  need_pickup: false,
  line_user_id: "",
  line_display_name: "",
});

const bookingSchema = z
  .object({
    check_in: z.string().min(1, "請選擇入住日期"),
    check_out: z.string().min(1, "請選擇退房日期"),
    room_type: z.enum(["single", "double", "family"]),
    people: z.number().min(1).max(6),
    name: z.string().min(1, "請輸入聯絡人"),
    phone: z.string().regex(/^\d{9,15}$/, "請輸入 9-15 位數字"),
    need_pickup: z.boolean(),
    line_user_id: z.string().min(1),
    line_display_name: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    const checkIn = new Date(data.check_in);
    const checkOut = new Date(data.check_out);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    if (checkIn < todayMidnight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["check_in"],
        message: "入住日期不可早於今天",
      });
    }

    if (checkOut <= checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["check_out"],
        message: "退房日期需晚於入住日期",
      });
    }
  });

const validationErrors = ref<Record<string, string>>({});
const isPageLoading = computed(() => loadingRooms.value || profileLoading.value);
const selectedRoom = computed(() => rooms.value.find((room) => room.code === form.room_type));

function validateForm() {
  validationErrors.value = {};
  try {
    bookingSchema.parse({ ...form });
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(error.flatten().fieldErrors)) {
        if (messages && messages.length) {
          fieldErrors[key] = messages[0];
        }
      }
      validationErrors.value = fieldErrors;
    }
    return false;
  }
}

const canSubmit = computed(() => {
  return !!form.check_in && !!form.check_out && !submitting.value;
});

async function loadInitialData() {
  try {
    const profile = await getProfile();
    form.name = profile.displayName;
    form.line_display_name = profile.displayName;
    form.line_user_id = profile.userId;
  } catch (error) {
    console.error("LIFF profile failed", error);
    errorMessage.value = "無法讀取 LINE 資料，請重新開啟 LIFF";
  } finally {
    profileLoading.value = false;
  }

  try {
    rooms.value = await fetchRooms();
  } catch (error) {
    console.error(error);
    errorMessage.value = "房型資料載入失敗，請稍後再試";
  } finally {
    loadingRooms.value = false;
  }
}

function resetForm() {
  form.check_in = "";
  form.check_out = "";
  form.room_type = "single";
  form.people = 1;
  form.phone = "";
  form.need_pickup = false;
  validationErrors.value = {};
}

async function submitBooking() {
  if (!validateForm()) {
    return;
  }

  submitting.value = true;
  errorMessage.value = null;

  const payload: BookingPayload = { ...form };

  try {
    const result = await createBooking(payload);
    submitSuccess.value = {
      id: result.id,
      check_in: form.check_in,
      check_out: form.check_out,
    };
  } catch (error: any) {
    console.error("Booking failed", error);
    if (error && typeof error === "object" && typeof error.message === "string" && error.message) {
      errorMessage.value = error.message;
    } else if (error?.response?.data?.error) {
      errorMessage.value = error.response.data.error;
    } else {
      errorMessage.value = "預約失敗，請稍後再試";
    }
  } finally {
    submitting.value = false;
  }
}

function startNewBooking() {
  submitSuccess.value = null;
  resetForm();
}

onMounted(() => {
  loadInitialData();
});
</script>

<template>
  <main class="min-h-screen bg-[#f5f5f5] px-4 py-10">
    <section class="mx-auto w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-xl">
      <header class="mb-6 text-center">
        <p class="text-xs uppercase tracking-[0.3em] text-gray-500">Guesthouse Booking</p>
        <h1 class="text-3xl font-semibold text-gray-900">入住預約</h1>
        <p class="mt-2 text-sm text-gray-500">透過 LINE LIFF 快速完成預約</p>
      </header>

      <div v-if="isPageLoading" class="flex flex-col items-center gap-3 py-12 text-gray-500">
        <span class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></span>
        <p>載入中，請稍候...</p>
      </div>

      <div v-else>
        <div v-if="submitSuccess" class="space-y-4 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            ✓
          </div>
          <h2 class="text-2xl font-semibold text-gray-900">預約成功</h2>
          <p class="text-sm text-gray-600">我們已收到您的預約申請，將盡快透過 LINE 與您確認。</p>
          <div class="rounded-2xl bg-gray-50 p-4 text-left text-sm text-gray-700">
            <p class="font-medium">訂單編號：{{ submitSuccess.id }}</p>
            <p>入住：{{ submitSuccess.check_in }}</p>
            <p>退房：{{ submitSuccess.check_out }}</p>
          </div>
          <button
            type="button"
            class="w-full rounded-2xl border border-primary px-4 py-3 font-medium text-primary transition hover:bg-primary/10"
            @click="startNewBooking"
          >
            再次預約
          </button>
        </div>

        <form v-else class="space-y-5" @submit.prevent="submitBooking">
          <div v-if="rooms.length" class="rounded-2xl bg-primary/5 p-4 text-sm text-gray-700">
            <p class="mb-2 font-semibold text-primary-dark">熱門房型</p>
            <ul class="space-y-1">
              <li v-for="room in rooms" :key="room.id" class="flex justify-between text-gray-600">
                <span>{{ room.name }}</span>
                <span>可入住 {{ room.capacity ?? '-' }} 人 / 共 {{ room.total_rooms }} 間</span>
              </li>
            </ul>
          </div>

          <div>
            <label class="form-label" for="check_in">入住日期</label>
            <input
              id="check_in"
              v-model="form.check_in"
              :min="minDate"
              type="date"
              class="form-input"
              required
            />
            <p v-if="validationErrors.check_in" class="form-error">{{ validationErrors.check_in }}</p>
          </div>

          <div>
            <label class="form-label" for="check_out">退房日期</label>
            <input
              id="check_out"
              v-model="form.check_out"
              :min="form.check_in || minDate"
              type="date"
              class="form-input"
              required
            />
            <p v-if="validationErrors.check_out" class="form-error">{{ validationErrors.check_out }}</p>
          </div>

          <div>
            <label class="form-label" for="room_type">選擇房型</label>
            <select id="room_type" v-model="form.room_type" class="form-select" :disabled="loadingRooms">
              <option value="single">單人房</option>
              <option value="double">雙人房</option>
              <option value="family">家庭房</option>
            </select>
            <p v-if="selectedRoom" class="mt-1 text-xs text-gray-500">
              最多 {{ selectedRoom.capacity ?? "-" }} 人，總計 {{ selectedRoom.total_rooms }} 間房可訂。
            </p>
          </div>

          <div>
            <label class="form-label" for="people">入住人數</label>
            <select id="people" v-model.number="form.people" class="form-select">
              <option v-for="people in 6" :key="people" :value="people">{{ people }} 位</option>
            </select>
          </div>

          <div>
            <label class="form-label" for="name">聯絡人</label>
            <input id="name" v-model="form.name" type="text" class="form-input" required />
            <p v-if="validationErrors.name" class="form-error">{{ validationErrors.name }}</p>
          </div>

          <div>
            <label class="form-label" for="phone">手機</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              inputmode="numeric"
              pattern="\d{9,15}"
              class="form-input"
              required
            />
            <p class="text-xs text-gray-500">僅限數字，9-15 位</p>
            <p v-if="validationErrors.phone" class="form-error">{{ validationErrors.phone }}</p>
          </div>

          <fieldset>
            <legend class="form-label">是否需要車站接送？</legend>
            <div class="mt-2 flex gap-4">
              <label class="pickup-option">
                <input type="radio" name="pickup" :value="true" v-model="form.need_pickup" />
                <span>需要</span>
              </label>
              <label class="pickup-option">
                <input type="radio" name="pickup" :value="false" v-model="form.need_pickup" />
                <span>不需要</span>
              </label>
            </div>
          </fieldset>

          <p v-if="errorMessage" class="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canSubmit"
          >
            {{ submitting ? "送出中..." : "送出預約" }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped>
.form-label {
  @apply mb-1 block text-sm font-medium text-gray-700;
}
.form-input {
  @apply w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-primary focus:ring-primary;
}
.form-select {
  @apply w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-primary focus:ring-primary;
}
.form-error {
  @apply mt-1 text-sm text-red-600;
}
.pickup-option {
  @apply inline-flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-700;
}
.pickup-option input {
  @apply text-primary focus:ring-primary;
}
</style>
