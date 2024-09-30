<template>
    <article>
        <picture :class="{'selected': selected}">
            <img :src="asset.url" alt="asset.name" />
        </picture>

        <!-- <section>   
            <h4>{{ asset.name }}</h4>
            <span>{{ asset.url }}</span>
        </section> -->
        <!-- eerder als tooltip? -->
    </article>
</template>

<script setup>
    defineProps({
        asset: {
            type: Object,
            required: true
        },
        selected: {
            type: Boolean,
            default: false
        }
    });
</script>

<style scoped>
article {
    color: #ddd;
    height: 100%;
    display: inline-block;
    margin: 0 3px;
}

article:hover {
    cursor: pointer;
}

article picture img {
    width: auto;
    height: 87%;
    margin-top:10%;
    margin-right: 8px;
}

picture {
    opacity: 0.6;
}

picture.selected {
    opacity: 1;
}

/* article picture img:hover {
    width: auto;
    height: 100%;
} */
</style>