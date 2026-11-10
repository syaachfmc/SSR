// src/constants/colors.js

const flatTheme = false;

export const APP_COLORS = {
    // --- WARNA NETRAL & DASAR ---
    bgPrimary: 'rgb(255, 255, 255)',

    bgPrimaryGrad: flatTheme
        ? 'rgba(255, 255, 255, 0)'
        : 'linear-gradient(180deg, rgb(255, 255, 255) 10%, rgb(250, 250, 250) 90%, rgb(240, 240, 240) 100%)',

    bgPrimaryGradB: 'linear-gradient(180deg,rgba(242, 242, 242, 1) 0%, rgb(248, 248, 248) 25%, rgba(248, 248, 248, 1) 76%, rgba(227, 227, 227, 1) 100%)',
    bgDisabled: 'rgb(200, 200, 200)',
    textPrimary: 'rgba(0, 30, 39, 0.86)',
    textSecondary: 'rgba(118, 118, 118, 0.71)',
    textDisabled: 'rgb(25, 25, 25)',

    // --- WARNA AKSEN ---
    textPrimaryAksen: 'rgba(0, 81, 173, 0.91)',
    textSecondaryAksen: 'rgba(120, 0, 219, 0.91)',
    textPrimaryAksen20: 'rgba(0, 81, 173, 0.2)',
    textSecondaryAksen20: 'rgba(120, 0, 219, 0.2)',

    // --- WARNA BORDER ---
    borderDefault: 'rgba(198, 199, 219, 0.82)',
    borderHover: 'rgb(0, 162, 255)',
    borderFocus: 'rgba(119, 119, 119, 0)',
    borderError: 'rgba(220, 53, 69, 1)',

    // --- WARNA STATE (DIRTY BADGE, ERROR) ---
    dirtyBadgeBg: 'rgb(255, 179, 0)',
    dirtyBadgeBorder: 'rgba(255, 196, 0, 1)',
    dirtyBadgeGlow: 'rgba(255, 251, 0, 0.8)',
    errorText: 'rgba(220, 53, 69, 1)',

    // --- WARNA DROPDOWN OPTIONS ---
    optionListBg: 'rgba(255, 255, 255, 1)',
    optionListBorder: 'rgba(204, 204, 204, 1)',
    optionHoverBg: 'rgba(230, 240, 255, 1)',
    optionHoverText: 'rgba(0, 86, 179, 1)',
    optionEmptyText: 'rgba(136, 136, 136, 1)',

    // --- SHADOWS ---
    shadowColorNormal: flatTheme ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0)',
    shadowColorHover: flatTheme ? 'rgba(255, 255, 255, 0)' : 'rgba(0, 0, 0, 0.08)',
    shadowColorFocus: 'rgba(0, 0, 0, 0.2)',
    shadowColorError: 'rgba(220, 53, 69, 0.2)',
    shadowColorErrorHover: 'rgba(220, 53, 69, 0.4)',

    // ---- BUTTON ----
    buttonBg: 'linear-gradient(180deg, rgb(241, 241, 241) 10%, rgb(224, 224, 224) 90%, rgb(213, 213, 213) 100%)',
    buttonBgSolid: 'rgb(13, 243, 255)',
    buttonBgDisabled: 'rgb(200, 200, 200)',

    buttonText: 'rgb(90, 90, 90)',
    buttonTextDisabled: 'rgb(200, 200, 200)',

    buttonBorder: 'rgba(204, 204, 204, 1)',
    buttonBorderHover: 'rgba(119, 119, 119, 1)',
    buttonBorderFocus: 'rgb(141, 141, 141)',

    buttonShadow: 'rgba(0, 0, 0, 0.1)',
    buttonShadowHover: 'rgba(0, 0, 0, 0.15)',
    buttonShadowFocus: 'rgba(0, 0, 0, 0.25)',

    bgGradNormal: 'linear-gradient(180deg, rgb(255, 255, 255) 10%, rgb(250, 250, 250) 90%, rgb(240, 240, 240) 100%)',
    bgGradHover: 'linear-gradient(180deg, rgb(250, 250, 250) 10%, rgb(233, 233, 233) 90%)',
    bgGradSelected: 'linear-gradient(180deg, rgb(221, 221, 221) 10%, rgb(206, 206, 206) 90%)',

    bgGradTextHover: 'rgb(0, 0, 0)',
    bgGradTextSelected: 'rgb(0, 0, 0)',
};

APP_COLORS.bgGradTextNormal = APP_COLORS.textPrimary;