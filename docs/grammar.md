# The Language of Gutenberg

At the core of Gutenberg lies the block abstraction. From a technical point of view, blocks both raise the level of abstraction from a single document to a collection of meaningful elements, and they replace ambiguity—inherent in HTML—with explicit structure. A post in Gutenberg is then a _collection of blocks_.

To understand how block operate at a data structure level, let's take a small detour to the simil of the printing press of Johannes Gutenberg. With the printing press, a “page” of a book was assembled from individual pieces and printed into a fully formed page. Once printed, there’s no need to know it was built from multiple blocks of letters instead of one giant plate. In other words, the output is indifferent about how it was generated.

This is true for content blocks. They are the way in which the user creates their content, but they no lopnger matter once the content is finished. That is, until it needs to be edited. Imagine if the printing press was able to print a page _while_ also including in the page the instruction to generate again the set of movable types required to print it. What we are doing with blocks could be compared to printing invisible marks on the text so that the printer can pick up, from an already printed page, the pieces it needs to reprint it.

Content in WordPress is stored as HTML-like text in `post_content`. HTML is a robust document markup format and has been used to describe content as simple as unformatted paragraphs of text and as complex as entire application interfaces. Understanding HTML is not trivial.

a significant number of existing documents and tools deal with technically invalid or ambiguous code. This code, even when valid, can be incredibly tricky and complicated to parse – to understand.

Similarities with the Gutenberg printing press remain. The movable type press constructed the content from individual blocks of metal, put together to construct... and then printed. The final printed form has no knowledge that it was done through individual pieces, because there's no need for that to bear any weight when someone is reading. In order to make further edits you had to go back to assemble the letters. Gutenberg leaves invisible marks on the printed paper so that a the printing press can reassemble all the individual letters again and be ready to manipulate.

## Blocks are higher-level than HTML

Blocks are a helpful tool to describe how to edit content that goes beyond simple text, but they don't carry much meaning _once_ the final page has been generated and is consumed as an HTML document. Even though the end result is HTML in a browser, a "block" connotes more meaning than the HTML it generates. That extra meaning is what enables the rich editing experience, as it allows the application to include tools to help the user craft the content they want. The HTML is augmented with the editing tools. For many blocks, the HTML produced is incidental, and subject to change. Blocks can be powerful and significantly more complex than the HTML they produce.

The problem an editor like Gutenberg faces is that once things have been transformed into HTML, there's no inherent meaning anymore in the HTML markup from which to construct a specific block interface back. That means the HTML content can be ambiguous: the _same_ markup can correspond to entirely _different_ blocks. One consequence of this fact is that it demonstrates how we have lost meaning when we move down to HTML alone. So there needs to be a reliable way to know a block type without having to understand HTML.

Additionally, how do we even know this came from our editor? Maybe someone snuck it in by hand when trying to quickly jump in and change the page. The structure of the higher-level meaning is implicit and indistinguishable from the same markup when entered manually. When Gutenberg operates on a block, it knows its type and attributes without inspecting the HTML source.

## A Tree of Blocks

During runtime, blocks are kept in memmory, Thus, a Gutenberg post isn't HTML, but a tree of objects and associated attributes. Gutenberg relies on a structure-preserving data model so that the editors and views for specific block types can remain independent from the final rendered HTML. It's a tree similar to how HTML is a tree, though at the top-level it's just a list of nodes—it needs no "root node".

The tree of objects describes the list of blocks that compose a post.

```js
[
    {
        type: 'core/cover-image',
        attributes: {
            url: 'my-hero.jpg',
            align: 'full',
            hasParallax: false,
            hasBackgroundDim: true
        },
        children: [
            "Gutenberg posts aren't HTML"
        ]
    },
    {
        type: 'core/paragraph',
        children: [
            "Lately I've been hearing plen…"
        ]
    }
]
```

## Serialization and the Purpose of HTML Comments

Gutenberg's data model, however, is something that lives in memory while editing a post. It's not visible to the page viewer when rendered. Like a printed page has no trace of the structure of the letters that originated it in the press.

Since the whole WordPress echosystem has an expectation for receiving HTML when rendering or editing a post, Gutenberg transforms its data model into something that can be saved in `post_content` through serialization. This assures that there's a single source of truth for the content, and that this source remains readable and comaptible with all the tools that interact with WordPress content at the present. Were we to store the object tree separately, the risk of the post_content and the tree getting out of sync and the dupication of data in both places.

Thus, the serialization process converts the tree into HTML using HTML comments as expicit block delimiters—which can contain the attributes in non-HTML form. This is the act of printing invisible marks on the printed page that leave a trace of the original structured intention.

This is one end of the process. The other is how to recreate the internal data tree of the collection of blocks whenever a post is to be edited again. A formal grammar defines how the serialized representation of a Gutenberg post should be loaded just as a some basic rules define how to turn the tree into an HTML-like string. Gutenberg posts aren't designed to be edited by hand; they aren't designed to be edited as HTML documents because Gutenberg posts aren't HTML in essence.

They just happen, incidentally, to be stored inside of `post_content` in a way in which they require no transformation in order to be viewable by any legacy system. It's true that loading the stored HTML into a browser without the corresponding machinery that the experience might degrade if it included dynamic blocks of content: dynamic elements may not load, server-generated content may not appear, interactive content may remain static. However, it at least protects against viewing Gutenberg posts on themes and installations which are Gutenberg-unaware, and provides the most accessible way to the content.

## Delimiters and Parsing Expression Grammar

We chose instead to try and find a way to keep the formality and explicitness and unambiguity into the existing HTML syntax. Within the HTML there are a number of options:

Of these options a novel approach was suggested that by storing data in HTML comments we would know that we wouldn't break the rest of the HTML in the document, that browsers should ignore it, and that we could simplify our approach to parsing the document.

Unique to comments is that they cannot legitimately exist in ambiguous places, such as inside of HTML attributes like `<img alt='data-id="14"'>`. Comments are also quite permissive. Whereas HTML attributes are complicated to parse properly, comments are quite easily described by a leading `<!--` followed by anything except `--` until the first `-->`. This simplicity and permisiveness means that the parser can be implemented in several ways without needing to understand HTML properly and we have the liberty to use more convenient syntax inside of the comment—we only need to escape double-hyphen sequences. We take advantage of this in how we store block attributes: JSON literals inside the comment.

After running this through the parser we're left with a simple object we can manipulate idiomatically and we don't have to worry about escaping or unescaping the data. It's handled for us through the serialization process. Because the comments are so differen than other HTML tags and because we can perform a first-pass to extract the top-level blocks, we don't actually depend on having fully-valid HTML!

This has dramatic implications for how simple and performant we can make our parser. These explicit boundaries also protect damage in a single block from bleeding into other blocks or tarnishing the entire document. It also allows the system to identify unrecognized blocks before rendering them.

## The Gutenberg Lifecycle

In summary, the workflow for editing a Gutenberg post starts with taking the persisted version of the document and generating the in-memory tree, aided by the presence of token delimiters. It ends with the reverse: serialization of blocks into `post_content`. During editing, all manipulations happen within the block tree. In summary, a Gutenberg post is built upon an in-memory data structure which gets persisted somehow in an fully-isomorphic way. Right now that persistence is via a serialization/parser pair but could just as easily be replaced through a plugin to store the data structure as a JSON blob somewhere else.