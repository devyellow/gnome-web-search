import Gio from 'gi://Gio';
import St from 'gi://St';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const SearchIndicator = GObject.registerClass(
class SearchIndicator extends PanelMenu.Button {
    _init(extensionPath) {
        super._init(0.0, _('Web Search'));

        // Icono en la barra
        this.add_child(new St.Icon({
            icon_name: 'system-search-symbolic',
            style_class: 'system-status-icon',
        }));

        // Campo de búsqueda
        this._entry = new St.Entry({
            hint_text: _('Google Search'),
            track_hover: true,
            can_focus: true,
            x_expand: true,
            style: 'min-width: 280px; padding: 6px;',
        });

        this._entry.clutter_text.connect('activate', () => {
            const text = this._entry.get_text().trim();
            if (!text)
                return;

            const url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;

            Gio.app_info_launch_default_for_uri(
                url,
                global.create_app_launch_context(
                    global.display.get_current_time_roundtrip(),
                    -1
                )
            );

            this.menu.close();
            this._entry.set_text('');
        });

        const item = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });

        item.add_child(this._entry);
        this.menu.addMenuItem(item);
        
        this.menu.connect('open-state-changed', (_, open) => {
            if (!open)
                return;

            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                this._entry.grab_key_focus();
                this._entry.set_text('');
                this._entry.clutter_text.set_selection(0, -1);
                return GLib.SOURCE_REMOVE;
            });
        });


    }
});

export default class WebSearchExtension extends Extension {
    enable() {
        this._indicator = new SearchIndicator(this.path);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}

