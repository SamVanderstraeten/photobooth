<template>
    <article>
        <picture>
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
        }
    });
</script>

<style scoped>
article {
    display: flex;
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
    height: 100%;
}

/* article picture img:hover {
    width: auto;
    height: 100%;
} */
</style>