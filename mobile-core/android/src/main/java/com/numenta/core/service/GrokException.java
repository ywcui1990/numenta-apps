/*
 * Numenta Platform for Intelligent Computing (NuPIC)
 * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero Public License for more details.
 *
 * You should have received a copy of the GNU Affero Public License
 * along with this program.  If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 *
 */

package com.numenta.core.service;

/**
 * Generic Grok Exception
 */
public class GrokException extends Exception {

    private static final long serialVersionUID = -6781138897947837629L;

    /**
     * TODO Document {@link GrokException} constructor
     */
    public GrokException() {
        // TODO Auto-generated constructor stub
    }

    /**
     * TODO Document {@link GrokException} constructor
     *
     * @param detailMessage
     */
    public GrokException(String detailMessage) {
        super(detailMessage);
        // TODO Auto-generated constructor stub
    }

    /**
     * TODO Document {@link GrokException} constructor
     *
     * @param throwable
     */
    public GrokException(Throwable throwable) {
        super(throwable);
        // TODO Auto-generated constructor stub
    }

    /**
     * TODO Document {@link GrokException} constructor
     *
     * @param detailMessage
     * @param throwable
     */
    public GrokException(String detailMessage, Throwable throwable) {
        super(detailMessage, throwable);
        // TODO Auto-generated constructor stub
    }

}
