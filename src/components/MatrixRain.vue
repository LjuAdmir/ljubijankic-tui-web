<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'

// half-width katakana and digits, like the film
const glyphs =
  Array.from({ length: 56 }, (_, i) => String.fromCharCode(0xff66 + i)).join('') + '0123456789'
const randomGlyph = () => glyphs[Math.floor(Math.random() * glyphs.length)]!

const canvas = useTemplateRef('canvas')
let timer: ReturnType<typeof setInterval> | undefined
let observer: ResizeObserver | undefined

onMounted(() => {
  const el = canvas.value!
  const context = el.getContext('2d')!
  const style = getComputedStyle(el)
  const colour = (name: string) => style.getPropertyValue(name).trim()
  const [background, green, head] = [
    colour('--background0'),
    colour('--green'),
    colour('--foreground0'),
  ]
  const lineHeight = parseFloat(style.lineHeight)
  let charWidth = 0
  let drops: { y: number; glyph: string }[] = []

  function resize() {
    const ratio = devicePixelRatio
    el.width = el.clientWidth * ratio
    el.height = el.clientHeight * ratio
    context.scale(ratio, ratio)
    // not style.font: Firefox leaves the shorthand empty, and the canvas falls back to 10px
    context.font = `${style.fontSize} ${style.fontFamily}`
    context.textBaseline = 'top'
    charWidth = context.measureText('0').width
    const rows = el.clientHeight / lineHeight
    // staggered above the top, so the streams don't all start at once
    drops = Array.from({ length: Math.ceil(el.clientWidth / charWidth) }, () => ({
      y: -Math.floor(Math.random() * rows),
      glyph: '',
    }))
  }

  resize()
  observer = new ResizeObserver(resize)
  observer.observe(el)

  timer = setInterval(() => {
    context.globalAlpha = 0.08
    context.fillStyle = background
    context.fillRect(0, 0, el.clientWidth, el.clientHeight)
    context.globalAlpha = 1

    drops.forEach((drop, column) => {
      const x = column * charWidth
      // last frame's head joins the green trail
      context.fillStyle = green
      context.fillText(drop.glyph, x, (drop.y - 1) * lineHeight)
      drop.glyph = randomGlyph()
      context.fillStyle = head
      context.fillText(drop.glyph, x, drop.y * lineHeight)

      if (drop.y * lineHeight > el.clientHeight && Math.random() > 0.95) drop.y = 0
      drop.y++
    })
  }, 60)
})

onUnmounted(() => {
  clearInterval(timer)
  observer?.disconnect()
})
</script>

<template>
  <canvas
    ref="canvas"
    class="matrix"
    aria-label="Green characters rain down the screen"
    role="img"
  />
</template>

<style scoped>
.matrix {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
