try {
  var dropdownMenus = document.querySelectorAll(".dropdown-menu.stop");
  dropdownMenus.forEach(function (e) {
    e.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });
} catch (e) {}
try {
  lucide.createIcons();
} catch (e) {}
try {
  var option1 = {
      series: [
        {
          type: "column",
          data: [
            [0, 2],
            [1, 3],
            [2, 4],
            [3, 8],
            [4, 5],
            [5, 12],
            [6, 17],
            [7, 19],
            [8, 6],
            [9, 9],
            [10, 14],
            [11, 17],
            [12, 12],
            [13, 6],
            [14, 4],
          ],
        },
        {
          type: "column",
          data: [
            [0, 9],
            [1, 7],
            [2, 4],
            [3, 8],
            [4, 4],
            [5, 12],
            [6, 4],
            [7, 6],
            [8, 5],
            [9, 10],
            [10, 4],
            [11, 5],
            [12, 10],
            [13, 2],
            [14, 6],
          ],
        },
      ],
      chart: {
        width: "100%",
        height: 60,
        parentHeightOffset: 0,
        stacked: !0,
        sparkline: { enabled: !0 },
      },
      states: {
        hover: { filter: { type: "none" } },
        active: { filter: { type: "none" } },
      },
      colors: ["#4f46e5", "#e5e9f2"],
      plotOptions: { bar: { columnWidth: "60%" } },
      stroke: { curve: "straight", lineCap: "square" },
      tooltip: {
        enabled: !0,
        onDatasetHover: { highlightDataSeries: !1 },
        x: { show: !1 },
      },
    },
    chart1 = new ApexCharts(document.querySelector("#apexBar1"), option1);
  chart1.render();
} catch (e) {}
try {
  var themeColorToggle = document.getElementById("light-dark-mode");
  themeColorToggle &&
    themeColorToggle.addEventListener("click", function (e) {
      "light" === document.documentElement.getAttribute("data-bs-theme")
        ? document.documentElement.setAttribute("data-bs-theme", "dark")
        : document.documentElement.setAttribute("data-bs-theme", "light");
    });
} catch (e) {}
try {
  var collapsedToggle = document.querySelector(".mobile-menu-btn");
  const i = document.querySelector(".startbar-overlay"),
    changeSidebarSize =
      (collapsedToggle?.addEventListener("click", function () {
        "collapsed" == document.body.getAttribute("data-sidebar-size")
          ? document.body.setAttribute("data-sidebar-size", "default")
          : document.body.setAttribute("data-sidebar-size", "collapsed");
      }),
      i &&
        i.addEventListener("click", () => {
          document.body.setAttribute("data-sidebar-size", "collapsed");
        }),
      () => {
        310 <= window.innerWidth && window.innerWidth <= 1440
          ? document.body.setAttribute("data-sidebar-size", "collapsed")
          : document.body.setAttribute("data-sidebar-size", "default");
      });
  window.addEventListener("resize", () => {
    changeSidebarSize();
  }),
    changeSidebarSize();
} catch (e) {}
try {
  collapsedToggle = document.querySelector(".endbar-btn");
  const l = document.querySelector(".endbar-overlay"),
    m =
      (collapsedToggle?.addEventListener("click", function () {
        "collapsed" == document.body.getAttribute("data-endbar-size")
          ? document.body.setAttribute("data-endbar-size", "default")
          : document.body.setAttribute("data-endbar-size", "collapsed");
      }),
      l &&
        l.addEventListener("click", () => {
          document.body.setAttribute("data-endbar-size", "collapsed");
        }),
      () => {
        310 <= window.innerWidth && window.innerWidth <= 1440
          ? document.body.setAttribute("data-endbar-size", "collapsed")
          : document.body.setAttribute("data-endbar-size", "default");
      });
  window.addEventListener("resize", () => {
    m();
  }),
    m();
} catch (e) {}
try {
  const p = document.querySelectorAll('[data-bs-toggle="tooltip"]'),
    q = [...p].map((e) => new bootstrap.Tooltip(e));
  var popoverTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="popover"]')
    ),
    popoverList = popoverTriggerList.map(function (e) {
      return new bootstrap.Popover(e);
    });
} catch (e) {}
try {
  changeSidebarSize(),
    window.addEventListener("resize", changeSidebarSize),
    window.addEventListener("resize", () => {
      changeSidebarSize();
    }),
    changeSidebarSize();
} catch (e) {}
function windowScroll() {
  var e = document.getElementById("topbar-custom");
  null != e &&
    (50 <= document.body.scrollTop || 50 <= document.documentElement.scrollTop
      ? e.classList.add("nav-sticky")
      : e.classList.remove("nav-sticky"));
}
window.addEventListener("scroll", (e) => {
  e.preventDefault(), windowScroll();
});
const initVerticalMenu = () => {
  var e = document.querySelectorAll(".navbar-nav li .collapse");
  document
    .querySelectorAll(".navbar-nav li [data-bs-toggle='collapse']")
    .forEach((e) => {
      e.addEventListener("click", function (e) {
        e.preventDefault();
      });
    }),
    e.forEach((e) => {
      e.addEventListener("show.bs.collapse", function (t) {
        const o = t.target.closest(".collapse.show");
        document.querySelectorAll(".navbar-nav .collapse.show").forEach((e) => {
          e !== t.target && e !== o && new bootstrap.Collapse(e).hide();
        });
      });
    }),
    document.querySelector(".navbar-nav") &&
      (document.querySelectorAll(".navbar-nav a").forEach(function (t) {
        var e = window.location.href.split(/[?#]/)[0];
        if (t.href === e) {
          t.classList.add("active"), t.parentNode.classList.add("active");
          let e = t.closest(".collapse");
          for (; e; )
            e.classList.add("show"),
              e.parentElement.children[0].classList.add("active"),
              e.parentElement.children[0].setAttribute("aria-expanded", "true"),
              (e = e.parentElement.closest(".collapse"));
        }
      }),
      setTimeout(function () {
        var e,
          a,
          n,
          r,
          d,
          c,
          t = document.querySelector(".nav-item li a.active");
        function l() {
          (e = c += 20), (t = r), (o = d);
          var e,
            t,
            o =
              (e /= n / 2) < 1
                ? (o / 2) * e * e + t
                : (-o / 2) * (--e * (e - 2) - 1) + t;
          (a.scrollTop = o), c < n && setTimeout(l, 20);
        }
        null != t &&
          ((e = document.querySelector(".main-nav .simplebar-content-wrapper")),
          (t = t.offsetTop - 300),
          e) &&
          100 < t &&
          ((n = 600), (r = (a = e).scrollTop), (d = t - r), (c = 0), l());
      }, 200));
};
initVerticalMenu();
