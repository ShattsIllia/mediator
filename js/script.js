class Mediator {
    constructor(horizontalMenu, verticalMenu) {
        this.horizontalMenu = horizontalMenu;
        this.horizontalMenu.setMediator(this);
        this.verticalMenu = verticalMenu;
        this.verticalMenu.setMediator(this);
    }

    notify(sender, author, action) {
        if (sender instanceof HorizontalMenu) {
            if (action === 'show') {
                this.verticalMenu.showArticleNames(author);
            }
            if (action === 'hide') {
                this.verticalMenu.hide();
            }
        }

        if (sender instanceof VerticalMenu) {
            if (action === 'show') {
                this.horizontalMenu.showArticleNames(author);
            }
            if (action === 'hide') {
                this.horizontalMenu.hide();
            }
        }
    }
}

class Menu {
    constructor(data) {
        this.data = data;
        this.menuItems = new Map();
        this.type = 'horizontal';
        this.hideMenuOnClickOutside();
    }

    hideMenuOnClickOutside() {
        document.body.addEventListener('click', (event) => {
            if (!event.target.classList.contains('menu__item')) {
                this.hide();
            }
        });
    }

    setMediator(mediator) {
        this.mediator = mediator;
    }

    notifyMediator(action, author) {
        this.mediator.notify(this, author, action);
    }

    createMenu(menuClass) {
        const mainHtmlElement = document.querySelector('.main');
        mainHtmlElement.insertAdjacentHTML('beforeend',
            `<div class="menu-wrapper">
            <div class="menu ${menuClass}"></div>
        </div>`);
        this.createMenuItem(this.data);
    }

    createMenuItem(data) {
        let menu;

        for (let entry of data) {
            let dropdownClass = '';
            if (this.type === 'horizontal') {
                dropdownClass = 'dropdown';
            } else {
                dropdownClass = 'dropleft';
            }
            menu = document.querySelector(`.${this.type}`);
            let btnGroup = document.createElement('div');
            btnGroup.classList.add('btn-group');
            btnGroup.classList.add(`${dropdownClass}`);
            menu.insertAdjacentElement('beforeend', btnGroup);
            let menuItem = document.createElement('input');
            menuItem.classList.add('menu__item');
            menuItem.classList.add('btn');
            menuItem.classList.add('btn-light');
            menuItem.classList.add('btn-lg');
            menuItem.classList.add('dropdown-toggle');
            menuItem.setAttribute('type', 'button');
            menuItem.setAttribute('id', 'dropdownMenuButton');
            menuItem.setAttribute('data-toggle', 'dropdown');
            menuItem.setAttribute('aria-haspopup', 'true');
            menuItem.setAttribute('aria-expanded', 'false');
            menuItem.setAttribute('value', entry[0]);

            btnGroup.insertAdjacentElement('beforeend', menuItem);
            let dropDownMenu = document.createElement('div');
            dropDownMenu.classList.add('dropdown-menu');
            dropDownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton');
            menuItem.insertAdjacentElement('afterend', dropDownMenu);
            menuItem.addEventListener('click', this.onMenuClick.bind(this));

            const reviews = this.data.get(entry[0]).reviews;
            reviews.forEach(review => {
                const reviewTitle = document.createElement('div');
                reviewTitle.classList.add('dropdown-item');
                reviewTitle.innerHTML = review.title;
                dropDownMenu.append(reviewTitle);
                reviewTitle.addEventListener('click', this.showArticle.bind(this))
            });
            this.menuItems.set(entry[0], menuItem);
        }
        return menu;
    }

    onMenuClick(event) {
        let author = event.target.defaultValue;
        this.hide();
        this.notifyMediator('show', author);
        this.showArticleNames(author);
    }

    showArticleNames(author) {
        const button = this.menuItems.get(author);
        this.hide();
        this.show(button);
    }

    show(button) {
        button.parentElement.classList.add('show');
        button.nextSibling.classList.add('show');
        button.nextSibling.setAttribute(
            'value',
            'position: absolute; transform: translate3d(10px, 70px, 0px); top: 0px; left: 0px; will-change: transform'
        );
    }

    hide() {
        let makeArrayFromMap = Array.from(this.menuItems)
        const openDropdown = makeArrayFromMap.filter(menuItem => menuItem[1].parentElement.classList.contains('show'));
        if (openDropdown.length > 0) {
            openDropdown[0][1].parentElement.classList.remove('show');
            openDropdown[0][1].nextSibling.classList.remove('show');
            openDropdown[0][1].nextSibling.setAttribute('value', '');
        }
    }

    showArticle(event) {
        let articleHtmlElement = document.querySelector('.article');
        if (articleHtmlElement) {
            articleHtmlElement.remove();
        }
        this.createArticle(event);
        this.notifyMediator('hide');
        this.hide();
    }

    createArticle(event) {
        const articleParentElement = document.querySelector('.main');
        const author = event.target.parentElement.previousSibling.getAttribute('value');
        let articleTitle = event.target.innerText;
        let data = this.data;
        const article = document.createElement('div');
        article.classList.add('article');
        let filteredByTitleArticle = data.get(author).reviews.filter(title => title.title === articleTitle);
        article.innerHTML = filteredByTitleArticle[0].content;
        articleParentElement.append(article);
    }
}

class HorizontalMenu extends Menu {
    constructor(data) {
        super(data);
        this.type = 'horizontal';
    }
}

class VerticalMenu extends Menu {
    constructor(data) {
        super(data);
        this.type = 'vertical';
    }
}

class Rewievs {
    constructor() {
        this.API_KEY = 'b4f5c0f05bf151014cc60d3244c26353';
        this.reviewsCount = 7;
    }

    async fetchMoviesJSON() {
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${this.API_KEY}&page=1`);
        const movies = await response.json();
        let authorReviews = new Map();
        for (let index = 0; index < this.reviewsCount; index++) {
            let id = movies.results[index].id;
            const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/reviews?api_key=${this.API_KEY}&language=en-US&page=1`)
            const reviews = await response.json();
            for (let j = 0; j < reviews.results.length; j++) {
                let author = reviews.results[j].author;
                let content = reviews.results[j].content;
                if (authorReviews.has(author)) {
                    let authorReview = authorReviews.get(author);
                    authorReview.reviews.push({ title: movies.results[index].original_title, content: content });
                    authorReviews.set(author, authorReview);
                } else {
                    authorReviews.set(author, { name: author, reviews: [{ title: movies.results[index].original_title, content: content }] });
                }
            }
        }
        return authorReviews;
    }
}

const authorReview = new Rewievs()
authorReview.fetchMoviesJSON().then((result) => {
    const horizontalMenu = new HorizontalMenu(result);
    const verticalMenu = new VerticalMenu(result);
    new Mediator(horizontalMenu, verticalMenu);
    horizontalMenu.createMenu('horizontal');
    verticalMenu.createMenu('vertical');
});