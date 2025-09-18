const ul = document.querySelector('.pagination ul');
const posts = document.querySelectorAll('.worldcup');

handlePagination(6,1);

function postVisability(postPerPage, currentPage) {
    let prev = (currentPage - 1) * postPerPage;
    let current = currentPage * postPerPage;
    
    posts.forEach((post, index)=>{
        post.classList.toggle("show", index >= prev && index < current);
    })
}

// Move pagination number on mouse click
function handlePagination(postPerPage, currentPage) {
    postVisability(postPerPage, currentPage);
    
    const totalPages = Math.ceil(posts.length / postPerPage);
    let pageNumbers = generatePageNumber(totalPages, currentPage);
    let li = ``;

    if (currentPage != 1) {
        li += `<li class="icon" onclick = "handlePagination(${postPerPage}, ${currentPage - 1})">&lt;</li>`;
    }
    
    for (let pageNumber of pageNumbers) {
        li += `<li class="page ${currentPage === pageNumber ? 'active' : ''}"
                onclick = "handlePagination(${postPerPage}, ${pageNumber})"
                >${pageNumber}</li>`; //if pageNumber is the current page, add .active class to the list element. Since the .active has its individual css, it will be shown differently.
    }
    if (currentPage != totalPages) {
        li += `<li class="icon" onclick = "handlePagination(${postPerPage}, ${currentPage + 1})">&gt;</li>`;
    }
    ul.innerHTML = li; //inner.html allows me to write new html which can make the page dynamic
}

// generate pagination numbers from 1 to maxPageNumber accordingly. 
function generatePageNumber(maxPage, currentPage) {
    const pagination = [];
    let pageNo = 1

    while (pageNo <= maxPage) {
    const isFirstPage = pageNo <= 1;
    const isLastPage = pageNo === maxPage;
    const isMiddlePage = Math.abs(pageNo - currentPage) <= 1;

    if (isFirstPage || isLastPage || isMiddlePage) {
        pagination.push(pageNo);
        pageNo++;
    } else {
        pagination.push('...');
        if (pageNo < currentPage) {
            pageNo = currentPage - 1;
        } else {
            pageNo = maxPage;
            }
        }
        // above can be shorten using 
        // pageNo = pageNo < currentPage ? currentPage -1 : totalPages
    }
    return pagination;
}