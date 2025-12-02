import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import PhonePage from "../pages/PhonePage.vue";
import PriceTrackPage from "../pages/PriceTrackPage.vue";
import ComparisonPage from "../pages/ComparisonPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import SurveyPage from "../pages/SurveyPage.vue";
import ChatPage from "../pages/ChatPage.vue";

const routes = [
  { path: "/", name: "Home", component: HomePage },
  { path: "/survey", name: "Survey", component: SurveyPage },
  { path: "/chat", name: "Chat", component: ChatPage },
  { path: "/phone", name: "Phone", component: PhonePage },
  { path: "/price-track", name: "PriceTrack", component: PriceTrackPage },
  { path: "/comparison", name: "Comparison", component: ComparisonPage },
  { path: "/login", name: "Login", component: LoginPage },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
