<script setup lang="ts">
import { useHead, useSeoMeta } from '@unhead/vue'
import { siteName, siteUrl } from '@/lib/site'

// defaults for the home page, an open file overrides them
const description = 'Building robust web solutions with Drupal, PHP, and more. Passionate about clean code, open-source, and gaming on Linux.'

useSeoMeta({
  title: siteName,
  description,
  ogSiteName: siteName,
  ogTitle: siteName,
  ogDescription: description,
  ogType: 'website',
  ogUrl: `${siteUrl}/`,
  twitterCard: 'summary',
})
useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/` }] })
</script>

<template>
  <RouterView />
</template>
